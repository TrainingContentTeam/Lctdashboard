import { useOutletContext } from 'react-router';
import { useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function DevelopmentPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDurationRange, setSelectedDurationRange] = useState<DurationRange>('all');
  
  const chartRef2 = useRef<HTMLDivElement>(null);
  
  // Get all development categories
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    
    unifiedData.forEach(course => {
      if (course.categoryBreakdown) {
        course.categoryBreakdown.forEach((_, category) => {
          categorySet.add(category);
        });
      }
    });
    
    return Array.from(categorySet).sort();
  }, [unifiedData]);
  
  const courseLengthQuality = useMemo(() => {
    const total = unifiedData.length;
    const withCourseLength = unifiedData.filter(course => getCourseLengthHours(course) !== null).length;
    const missing = total - withCourseLength;
    const coveragePercent = total > 0 ? (withCourseLength / total) * 100 : 0;

    return { total, withCourseLength, missing, coveragePercent };
  }, [unifiedData]);

  const durationFilteredCourses = useMemo(() => {
    if (selectedDurationRange === 'all') return unifiedData;

    return unifiedData.filter(course => {
      const hours = getCourseLengthHours(course);
      if (hours === null) return false;
      return matchesDurationRange(hours, selectedDurationRange);
    });
  }, [unifiedData, selectedDurationRange]);

  // Comparison chart data:
  // Initial view = total time spent avg per course by year.
  // Filtered view = selected category avg times per year.
  const comparisonDataByYear = useMemo(() => {
    const yearMap = new Map<number, {
      totalTime: number;
      courseCount: number;
      categories: Map<string, { totalTime: number; count: number }>;
    }>();

    durationFilteredCourses.forEach(course => {
      const year = course.reportingYear;
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          totalTime: 0,
          courseCount: 0,
          categories: new Map()
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.totalTime += course.totalTime;
      yearData.courseCount += 1;

      if (course.categoryBreakdown) {
        course.categoryBreakdown.forEach((time, category) => {
          if (!yearData.categories.has(category)) {
            yearData.categories.set(category, { totalTime: 0, count: 0 });
          }
          const categoryData = yearData.categories.get(category)!;
          categoryData.totalTime += time;
          categoryData.count += 1;
        });
      }
    });

    return Array.from(yearMap.entries())
      .map(([year, data]) => {
        const row: Record<string, number> = {
          year,
          totalAvg: parseFloat((data.totalTime / data.courseCount).toFixed(1))
        };

        selectedCategories.forEach((category) => {
          const categoryData = data.categories.get(category);
          row[category] = categoryData && categoryData.count > 0
            ? parseFloat((categoryData.totalTime / categoryData.count).toFixed(1))
            : 0;
        });

        return row;
      })
      .sort((a, b) => a.year - b.year);
  }, [durationFilteredCourses, selectedCategories]);

  const activeSeriesKeys = selectedCategories.length > 0 ? selectedCategories : ['totalAvg'];
  const activeSeriesLabel = selectedCategories.length > 0
    ? 'Selected time entry categories'
    : 'Time Spent (Total)';
  const accuracyStatus = getAccuracyStatus(courseLengthQuality.coveragePercent);
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const downloadChart = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await toPng(chartRef.current, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas;
      link.click();
    } catch (error) {
      console.error('Failed to download chart:', error);
    }
  };
  
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-semibold mb-2">Development Analytics</h2>
            <p className="text-gray-600">Course development time trends and category breakdowns</p>
          </div>
          
          {/* Development Categories Year-over-Year - CHART */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Development Categories Year-over-Year</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Compare average course development time by year. Initial view shows Time Spent (Total).
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChart(chartRef2, 'development-categories-by-year.png')}
                >
                  <Download className="size-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-medium">Select Categories:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Course Duration Range:</span>
                    <Select
                      value={selectedDurationRange}
                      onValueChange={(value: DurationRange) => setSelectedDurationRange(value)}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Select duration range" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_RANGE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableCategories.map(category => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                      {selectedCategories.includes(category) && (
                        <X className="size-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Current view: <span className="font-medium">{activeSeriesLabel}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategories([])}
                      >
                        Clear category filters
                      </Button>
                    )}
                    {selectedDurationRange !== 'all' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDurationRange('all')}
                      >
                        Clear duration filter
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 px-1">
                <p>
                  Showing <span className="font-medium">{durationFilteredCourses.length}</span> course(s) in range{' '}
                  <span className="font-medium">{DURATION_RANGE_OPTIONS.find(opt => opt.value === selectedDurationRange)?.label}</span>.
                </p>
                <p className={`inline-flex items-center gap-1.5 ${accuracyStatus.textClass}`}>
                  <span className={`inline-block size-2 rounded-full ${accuracyStatus.dotClass}`} />
                  Course Length Accuracy: {courseLengthQuality.coveragePercent.toFixed(1)}%
                  {' '}({courseLengthQuality.withCourseLength}/{courseLengthQuality.total}) • Missing: {courseLengthQuality.missing}
                </p>
              </div>

              <div ref={chartRef2} className="border rounded-lg bg-white p-4">
                {comparisonDataByYear.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-sm text-gray-500">
                    No courses match the selected duration range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={comparisonDataByYear}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis label={{ value: 'Average Hours', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      {activeSeriesKeys.map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={key === 'totalAvg' ? '#3b82f6' : ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6'][index % 7]}
                          strokeWidth={2}
                          name={key === 'totalAvg' ? 'Time Spent (Total)' : key}
                          dot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

type DurationRange = 'all' | 'lt1' | '1to2' | '2to4' | '4to8' | '8plus';

const DURATION_RANGE_OPTIONS: Array<{ value: DurationRange; label: string }> = [
  { value: 'all', label: 'All Durations' },
  { value: 'lt1', label: 'Less than 1 hour' },
  { value: '1to2', label: '1 to 2 hours' },
  { value: '2to4', label: '2 to 4 hours' },
  { value: '4to8', label: '4 to 8 hours' },
  { value: '8plus', label: '8+ hours' }
];

function matchesDurationRange(hours: number, range: DurationRange): boolean {
  switch (range) {
    case 'lt1':
      return hours < 1;
    case '1to2':
      return hours >= 1 && hours < 2;
    case '2to4':
      return hours >= 2 && hours < 4;
    case '4to8':
      return hours >= 4 && hours < 8;
    case '8plus':
      return hours >= 8;
    case 'all':
    default:
      return true;
  }
}

function getCourseLengthHours(course: UnifiedCourseData): number | null {
  const courseLengthKey = Object.keys(course.metadata).find(key => {
    const lower = key.toLowerCase();
    return lower.includes('course') && lower.includes('length');
  });

  if (!courseLengthKey) return null;
  const rawValue = course.metadata[courseLengthKey];
  if (!rawValue || String(rawValue).trim() === '') return null;

  const value = String(rawValue).trim().toLowerCase();

  if (value.includes('less than') && value.includes('hour')) return 0.5;
  if (value.includes('under') && value.includes('hour')) return 0.5;

  const hhmmMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hhmmMatch) {
    const h = Number(hhmmMatch[1]);
    const m = Number(hhmmMatch[2]);
    const s = hhmmMatch[3] ? Number(hhmmMatch[3]) : 0;
    return h + m / 60 + s / 3600;
  }

  const rangeMatch = value.match(/(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (!Number.isNaN(start) && !Number.isNaN(end)) return (start + end) / 2;
  }

  const minMatch = value.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\b/);
  if (minMatch) {
    const minutes = Number(minMatch[1]);
    return Number.isNaN(minutes) ? null : minutes / 60;
  }

  const hourMatch = value.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    return Number.isNaN(hours) ? null : hours;
  }

  const numericOnly = Number(value.replace(/[^\d.]/g, ''));
  return Number.isNaN(numericOnly) ? null : numericOnly;
}

function getAccuracyStatus(coveragePercent: number): { dotClass: string; textClass: string } {
  if (coveragePercent >= 90) {
    return { dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
  }
  if (coveragePercent >= 70) {
    return { dotClass: 'bg-amber-500', textClass: 'text-amber-700' };
  }
  return { dotClass: 'bg-rose-500', textClass: 'text-rose-700' };
}
