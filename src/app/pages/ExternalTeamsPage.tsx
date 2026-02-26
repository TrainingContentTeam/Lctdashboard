import { useOutletContext } from 'react-router';
import { useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Input } from '../components/ui/input';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function ExternalTeamsPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();

  const legalTrendRef = useRef<HTMLDivElement>(null);

  const legalTimeByYear = useMemo(() => {
    const yearTimeMap = new Map<number, number>();

    unifiedData.forEach(course => {
      if (!course.categoryBreakdown) return;
      const year = course.reportingYear;
      let legalTime = 0;

      course.categoryBreakdown.forEach((time, category) => {
        if (isLegalCategory(category)) {
          legalTime += time;
        }
      });

      if (legalTime > 0) {
        yearTimeMap.set(year, (yearTimeMap.get(year) || 0) + legalTime);
      }
    });

    return Array.from(yearTimeMap.entries())
      .map(([year, time]) => ({ year, time: parseFloat(time.toFixed(1)) }))
      .sort((a, b) => a.year - b.year);
  }, [unifiedData]);

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
            <h2 className="text-3xl font-semibold mb-2">External Teams Analytics</h2>
            <p className="text-gray-600">Legal reviewers, CQO, and external collaboration metrics</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal Collaboration</h3>
            <LegalReviewerByYearChart courses={unifiedData} />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Legal Review Time Trend</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Total hours spent on legal reviews each year
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadChart(legalTrendRef, 'legal-time-trend.png')}
                  >
                    <Download className="size-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {legalTimeByYear.length === 0 ? (
                  <div className="p-8 text-center border rounded-lg bg-gray-50">
                    <p className="text-gray-600">No legal review time data available.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Time Spent data should include "Legal Review" or "Legal" categories.
                    </p>
                  </div>
                ) : (
                  <div ref={legalTrendRef}>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={legalTimeByYear}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis label={{ value: 'Total Hours', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="time"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Legal Review Hours"
                          dot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">CQO Collaboration</h3>
            <CQOTimeByYearChart courses={unifiedData} />
          </div>
        </div>
      </div>
    </main>
  );
}

function LegalReviewerByYearChart({ courses }: { courses: UnifiedCourseData[] }) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDurationRange, setSelectedDurationRange] = useState<DurationRange>('all');
  const [selectedReviewer, setSelectedReviewer] = useState<string>('all');
  const [searchReviewer, setSearchReviewer] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);

  const durationFilteredCourses = useMemo(() => {
    if (selectedDurationRange === 'all') return courses;
    return courses.filter(course => {
      const hours = getCourseLengthHours(course);
      return hours !== null && matchesDurationRange(hours, selectedDurationRange);
    });
  }, [courses, selectedDurationRange]);

  const qualityScopeCourses = useMemo(() => {
    if (selectedYear === 'all') return durationFilteredCourses;
    return durationFilteredCourses.filter(course => course.reportingYear === Number(selectedYear));
  }, [durationFilteredCourses, selectedYear]);

  const years = useMemo(() => {
    const set = new Set<number>();
    durationFilteredCourses.forEach(c => set.add(c.reportingYear));
    return Array.from(set).sort((a, b) => a - b);
  }, [durationFilteredCourses]);

  const reviewers = useMemo(() => {
    const set = new Set<string>();
    qualityScopeCourses.forEach(course => {
      const legal = getLegalReviewerState(course);
      if (legal.isNamedReviewer) set.add(legal.displayValue!);
    });
    return Array.from(set).sort();
  }, [qualityScopeCourses]);

  const legalDataQuality = useMemo(() => {
    const total = qualityScopeCourses.length;
    const withLegalValue = qualityScopeCourses.filter(course => {
      const legal = getLegalReviewerState(course);
      return legal.isNamedReviewer || legal.isExplicitNoReview;
    }).length;
    const missing = total - withLegalValue;
    const coveragePercent = total > 0 ? (withLegalValue / total) * 100 : 0;
    return { total, withLegalValue, missing, coveragePercent };
  }, [qualityScopeCourses]);
  const accuracyStatus = getAccuracyStatus(legalDataQuality.coveragePercent);

  const scopedCourses = useMemo(() => {
    return qualityScopeCourses.filter(course => {
      const legal = getLegalReviewerState(course);
      if (!legal.isNamedReviewer) return false;

      if (selectedReviewer !== 'all' && legal.displayValue !== selectedReviewer) return false;
      if (searchReviewer && !legal.displayValue!.toLowerCase().includes(searchReviewer.toLowerCase())) return false;

      return true;
    });
  }, [qualityScopeCourses, selectedReviewer, searchReviewer]);

  const topReviewers = useMemo(() => {
    const counts = new Map<string, number>();
    scopedCourses.forEach(course => {
      const legal = getLegalReviewerState(course);
      if (!legal.isNamedReviewer) return;
      counts.set(legal.displayValue!, (counts.get(legal.displayValue!) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [scopedCourses]);

  const chartData = useMemo(() => {
    const map = new Map<number, Record<string, number>>();
    const topSet = new Set(topReviewers);

    scopedCourses.forEach(course => {
      const legal = getLegalReviewerState(course);
      if (!legal.isNamedReviewer || !topSet.has(legal.displayValue!)) return;

      const year = course.reportingYear;
      if (!map.has(year)) map.set(year, { year });
      const row = map.get(year)!;
      row[legal.displayValue!] = (row[legal.displayValue!] || 0) + 1;
    });

    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [scopedCourses, topReviewers]);

  const downloadChart = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'legal-reviewers-workload-by-year.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download chart:', error);
    }
  };

  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Reviewer Workload by Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border rounded-lg bg-gray-50">
            <p className="text-gray-600">No course data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Legal Reviewer Workload by Year</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Reviewer course counts by year with inline filters and data quality status
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadChart}>
            <Download className="size-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="legal-year-filter-inline">Filter by Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="legal-year-filter-inline" className="mt-1.5">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="legal-duration-range-inline">Course Duration Range</Label>
            <Select value={selectedDurationRange} onValueChange={(value: DurationRange) => setSelectedDurationRange(value)}>
              <SelectTrigger id="legal-duration-range-inline" className="mt-1.5">
                <SelectValue placeholder="All durations" />
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

          <div>
            <Label htmlFor="legal-reviewer-filter-inline">Filter by Reviewer</Label>
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger id="legal-reviewer-filter-inline" className="mt-1.5">
                <SelectValue placeholder="All Reviewers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviewers</SelectItem>
                {reviewers.map(reviewer => (
                  <SelectItem key={reviewer} value={reviewer}>
                    {reviewer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="legal-reviewer-search-inline">Search Reviewer</Label>
            <Input
              id="legal-reviewer-search-inline"
              placeholder="Search by reviewer name..."
              value={searchReviewer}
              onChange={(e) => setSearchReviewer(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 px-1">
          <p>
            Courses in chart scope: <span className="font-medium">{scopedCourses.length}</span>
          </p>
          <p className={`inline-flex items-center gap-1.5 ${accuracyStatus.textClass}`}>
            <span className={`inline-block size-2 rounded-full ${accuracyStatus.dotClass}`} />
            Legal Reviewer Data Accuracy: {legalDataQuality.coveragePercent.toFixed(1)}%
            {' '}({legalDataQuality.withLegalValue}/{legalDataQuality.total}) • Missing: {legalDataQuality.missing}
          </p>
        </div>

        <p className="text-xs text-gray-500 px-1">
          If legal review was not required, set the Legal Reviewer field to <strong>None</strong> or <strong>Null</strong> so it is counted as valid data.
        </p>

        <div ref={chartRef} className="border rounded-lg bg-white p-4">
          {chartData.length > 0 && topReviewers.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {topReviewers.map((reviewer, index) => (
                  <Bar
                    key={reviewer}
                    dataKey={reviewer}
                    name={reviewer}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[420px] flex items-center justify-center text-sm text-gray-500">
              No legal reviewer data found for current filters.
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Showing up to {topReviewers.length} reviewers across {chartData.length} year(s)
        </p>
      </CardContent>
    </Card>
  );
}

function CQOTimeByYearChart({ courses }: { courses: UnifiedCourseData[] }) {
  const [selectedDurationRange, setSelectedDurationRange] = useState<DurationRange>('all');
  const [selectedVertical, setSelectedVertical] = useState<string>('all');
  const [selectedIdAssigned, setSelectedIdAssigned] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const chartRef = useRef<HTMLDivElement>(null);

  const durationFilteredCourses = useMemo(() => {
    if (selectedDurationRange === 'all') return courses;
    return courses.filter(course => {
      const hours = getCourseLengthHours(course);
      return hours !== null && matchesDurationRange(hours, selectedDurationRange);
    });
  }, [courses, selectedDurationRange]);

  const years = useMemo(() => {
    const set = new Set<number>();
    durationFilteredCourses.forEach(course => set.add(course.reportingYear));
    return Array.from(set).sort((a, b) => a - b);
  }, [durationFilteredCourses]);

  const ids = useMemo(() => {
    const set = new Set<string>();
    durationFilteredCourses.forEach(course => {
      const id = getAssignedId(course);
      if (id) set.add(id);
    });
    return Array.from(set).sort();
  }, [durationFilteredCourses]);

  const scopedCourses = useMemo(() => {
    return durationFilteredCourses.filter(course => {
      if (selectedYear !== 'all' && course.reportingYear !== Number(selectedYear)) return false;

      if (selectedVertical !== 'all') {
        const vertical = getVertical(course);
        if (!vertical || !vertical.toLowerCase().includes(selectedVertical.toLowerCase())) return false;
      }

      if (selectedIdAssigned !== 'all') {
        const id = getAssignedId(course);
        if (id !== selectedIdAssigned) return false;
      }

      return true;
    });
  }, [durationFilteredCourses, selectedYear, selectedVertical, selectedIdAssigned]);

  const cqoByYear = useMemo(() => {
    const yearMap = new Map<number, number>();

    scopedCourses.forEach(course => {
      if (!course.categoryBreakdown) return;
      let cqoTime = 0;

      course.categoryBreakdown.forEach((time, category) => {
        if (isCQOCategory(category)) {
          cqoTime += time;
        }
      });

      if (cqoTime > 0) {
        yearMap.set(course.reportingYear, (yearMap.get(course.reportingYear) || 0) + cqoTime);
      }
    });

    return Array.from(yearMap.entries())
      .map(([year, totalTime]) => ({ year, totalTime: parseFloat(totalTime.toFixed(1)) }))
      .sort((a, b) => a.year - b.year);
  }, [scopedCourses]);

  const downloadChart = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'cqo-time-by-year-filtered.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download chart:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>CQO & Quality Assurance Time - Year-over-Year</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Compare CQO review time spent by course duration, vertical, ID assigned, and year
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadChart}>
            <Download className="size-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="cqo-duration-range">Course Duration Range</Label>
            <Select value={selectedDurationRange} onValueChange={(value: DurationRange) => setSelectedDurationRange(value)}>
              <SelectTrigger id="cqo-duration-range" className="mt-1.5">
                <SelectValue placeholder="All durations" />
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

          <div>
            <Label htmlFor="cqo-vertical-filter">Vertical</Label>
            <Select value={selectedVertical} onValueChange={setSelectedVertical}>
              <SelectTrigger id="cqo-vertical-filter" className="mt-1.5">
                <SelectValue placeholder="All Verticals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verticals</SelectItem>
                {CQO_VERTICAL_OPTIONS.map(vertical => (
                  <SelectItem key={vertical} value={vertical}>
                    {vertical}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cqo-id-filter">ID Assigned</Label>
            <Select value={selectedIdAssigned} onValueChange={setSelectedIdAssigned}>
              <SelectTrigger id="cqo-id-filter" className="mt-1.5">
                <SelectValue placeholder="All IDs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All IDs</SelectItem>
                {ids.map(id => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cqo-year-filter">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="cqo-year-filter" className="mt-1.5">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-gray-600 px-1">
          Current view: <span className="font-medium">Time Spent (Total CQO/QA)</span> • Courses in scope: <span className="font-medium">{scopedCourses.length}</span>
        </div>

        <div ref={chartRef} className="border rounded-lg bg-white p-4">
          {cqoByYear.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cqoByYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: 'Total Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalTime"
                  name="CQO/QA Time Spent (hrs)"
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-sm text-gray-500">
              No CQO/QA data found for current filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6', '#84cc16'];

type DurationRange = 'all' | 'lt1' | '1to2' | '2to4' | '4to8' | '8plus';

const DURATION_RANGE_OPTIONS: Array<{ value: DurationRange; label: string }> = [
  { value: 'all', label: 'All Durations' },
  { value: 'lt1', label: 'Less than 1 hour' },
  { value: '1to2', label: '1 to 2 hours' },
  { value: '2to4', label: '2 to 4 hours' },
  { value: '4to8', label: '4 to 8 hours' },
  { value: '8plus', label: '8+ hours' }
];

const CQO_VERTICAL_OPTIONS = ['P1A', 'EMS1', 'FR1A', 'C1A', 'D1A', 'LGU', 'General', 'Wellness', 'Lexipol'];

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

function getAssignedId(course: UnifiedCourseData): string | null {
  const idKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('id') && k.toLowerCase().includes('assigned'));
  if (!idKey || !course.metadata[idKey]) return null;
  const id = String(course.metadata[idKey]).trim();
  return id || null;
}

function getVertical(course: UnifiedCourseData): string | null {
  const verticalKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('vertical'));
  if (!verticalKey || !course.metadata[verticalKey]) return null;
  const vertical = String(course.metadata[verticalKey]).trim();
  return vertical || null;
}

function isCQOCategory(category: string): boolean {
  const lower = category.toLowerCase();
  return lower.includes('cqo') || lower.includes('quality review') || lower.includes('qa testing') || lower.includes('uat testing');
}

function isLegalCategory(category: string): boolean {
  const lower = category.toLowerCase();
  return lower.includes('legal review') || lower === 'legal' || lower.includes('compliance review');
}

function getLegalReviewerState(course: UnifiedCourseData): {
  displayValue: string | null;
  isNamedReviewer: boolean;
  isExplicitNoReview: boolean;
} {
  const legalKey = Object.keys(course.metadata).find(k =>
    k.toLowerCase().includes('legal') && k.toLowerCase().includes('reviewer')
  );

  if (!legalKey) {
    return {
      displayValue: null,
      isNamedReviewer: false,
      isExplicitNoReview: false
    };
  }

  const rawValue = course.metadata[legalKey];

  if (rawValue === null) {
    return {
      displayValue: 'Null',
      isNamedReviewer: false,
      isExplicitNoReview: true
    };
  }

  if (rawValue === undefined) {
    return {
      displayValue: null,
      isNamedReviewer: false,
      isExplicitNoReview: false
    };
  }

  const value = String(rawValue).trim();
  if (!value) {
    return {
      displayValue: null,
      isNamedReviewer: false,
      isExplicitNoReview: false
    };
  }

  const normalized = value.toLowerCase();
  const explicitNoReviewValues = new Set(['none', 'null', 'n/a', 'na', 'not needed', 'not required']);
  const isExplicitNoReview = explicitNoReviewValues.has(normalized);

  return {
    displayValue: value,
    isNamedReviewer: !isExplicitNoReview,
    isExplicitNoReview
  };
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
