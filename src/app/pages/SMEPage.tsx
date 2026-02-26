import { useOutletContext } from 'react-router';
import { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Download } from 'lucide-react';
import { Input } from '../components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function SMEPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-semibold mb-2">SME Collaboration Analytics</h2>
            <p className="text-gray-600">Track SME engagement and efficiency trends by year</p>
          </div>

          <TopSMEsByYearChart courses={unifiedData} />
        </div>
      </div>
    </main>
  );
}

function TopSMEsByYearChart({ courses }: {
  courses: UnifiedCourseData[];
}) {
  const [selectedDurationRange, setSelectedDurationRange] = useState<DurationRange>('all');
  const [selectedSME, setSelectedSME] = useState<string>('all');
  const [selectedID, setSelectedID] = useState<string>('all');
  const [searchSME, setSearchSME] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);

  // Base scope for quality indicator: only duration filter, not SME/ID filters.
  const durationFilteredCourses = useMemo(() => {
    if (selectedDurationRange === 'all') return courses;
    return courses.filter(course => {
      const hours = getCourseLengthHours(course);
      return hours !== null && matchesDurationRange(hours, selectedDurationRange);
    });
  }, [courses, selectedDurationRange]);

  const { smes, ids } = useMemo(() => {
    const smeSet = new Set<string>();
    const idSet = new Set<string>();

    durationFilteredCourses.forEach(course => {
      const sme = getCourseSME(course);
      if (sme) smeSet.add(sme);

      const id = getAssignedId(course);
      if (id) idSet.add(id);
    });

    return {
      smes: Array.from(smeSet).sort(),
      ids: Array.from(idSet).sort()
    };
  }, [durationFilteredCourses]);

  const smeDataQuality = useMemo(() => {
    const total = durationFilteredCourses.length;
    const withSME = durationFilteredCourses.filter(course => getCourseSME(course) !== null).length;
    const missing = total - withSME;
    const coveragePercent = total > 0 ? (withSME / total) * 100 : 0;
    return { total, withSME, missing, coveragePercent };
  }, [durationFilteredCourses]);
  const accuracyStatus = getAccuracyStatus(smeDataQuality.coveragePercent);

  const scopedCourses = useMemo(() => {
    return durationFilteredCourses.filter(course => {
      if (selectedSME !== 'all') {
        const sme = getCourseSME(course);
        if (sme !== selectedSME) return false;
      }

      if (selectedID !== 'all') {
        const id = getAssignedId(course);
        if (id !== selectedID) return false;
      }

      return true;
    });
  }, [durationFilteredCourses, selectedSME, selectedID]);

  const topSMENames = useMemo(() => {
    const counts = new Map<string, number>();

    scopedCourses.forEach(course => {
      const sme = getCourseSME(course);
      if (!sme) return;
      if (searchSME && !sme.toLowerCase().includes(searchSME.toLowerCase())) return;
      counts.set(sme, (counts.get(sme) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([sme]) => sme);
  }, [scopedCourses, searchSME]);

  const chartData = useMemo(() => {
    const yearMap = new Map<number, Record<string, number>>();
    const topSMESet = new Set(topSMENames);

    scopedCourses.forEach(course => {
      const sme = getCourseSME(course);
      if (!sme || !topSMESet.has(sme)) return;

      const year = course.reportingYear;
      if (!yearMap.has(year)) yearMap.set(year, { year });
      const row = yearMap.get(year)!;
      row[sme] = (row[sme] || 0) + 1;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [scopedCourses, topSMENames]);

  const downloadChart = async () => {
    if (chartRef.current) {
      try {
        const dataUrl = await toPng(chartRef.current, { backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = 'top-smes-by-year.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download chart:', error);
      }
    }
  };

  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top SMEs by Course Count by Year</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Most active SMEs across all projects
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border rounded-lg bg-gray-50">
            <p className="text-gray-600">No SME data available.</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure your data files contain an "SME" field.
            </p>
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
            <CardTitle>Top SMEs by Course Count by Year</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Most active SMEs across years with duration, SME, and ID filters
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadChart}
          >
            <Download className="size-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="duration-range-sme">Course Duration Range</Label>
            <Select value={selectedDurationRange} onValueChange={(value: DurationRange) => setSelectedDurationRange(value)}>
              <SelectTrigger id="duration-range-sme" className="mt-1.5">
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
            <Label htmlFor="sme-filter-inline">Filter by SME</Label>
            <Select value={selectedSME} onValueChange={setSelectedSME}>
              <SelectTrigger id="sme-filter-inline" className="mt-1.5">
                <SelectValue placeholder="All SMEs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SMEs</SelectItem>
                {smes.map(sme => (
                  <SelectItem key={sme} value={sme}>
                    {sme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="id-filter-inline">Filter by ID Assigned</Label>
            <Select value={selectedID} onValueChange={setSelectedID}>
              <SelectTrigger id="id-filter-inline" className="mt-1.5">
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
            <Label htmlFor="sme-search">Search SME</Label>
            <Input
              id="sme-search"
              placeholder="Search by SME name..."
              value={searchSME}
              onChange={(e) => setSearchSME(e.target.value)}
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
            SME Data Accuracy: {smeDataQuality.coveragePercent.toFixed(1)}%
            {' '}({smeDataQuality.withSME}/{smeDataQuality.total}) • Missing SME: {smeDataQuality.missing}
          </p>
        </div>

        <div ref={chartRef} className="border rounded-lg bg-white p-4">
          {chartData.length > 0 && topSMENames.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {topSMENames.map((sme, index) => (
                  <Bar
                    key={sme}
                    dataKey={sme}
                    name={sme}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[420px] flex items-center justify-center text-sm text-gray-500">
              No SME data found for current filters.
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          Showing up to {topSMENames.length} SMEs across {chartData.length} year(s)
        </p>
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

function getCourseSME(course: UnifiedCourseData): string | null {
  const smeKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('sme'));
  if (!smeKey || !course.metadata[smeKey]) return null;
  const sme = String(course.metadata[smeKey]).trim();
  return sme || null;
}

function getAssignedId(course: UnifiedCourseData): string | null {
  const idKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('id') && k.toLowerCase().includes('assigned'));
  if (!idKey || !course.metadata[idKey]) return null;
  const id = String(course.metadata[idKey]).trim();
  return id || null;
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

function getAccuracyStatus(coveragePercent: number): { dotClass: string; textClass: string } {
  if (coveragePercent >= 90) {
    return { dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
  }
  if (coveragePercent >= 70) {
    return { dotClass: 'bg-amber-500', textClass: 'text-amber-700' };
  }
  return { dotClass: 'bg-rose-500', textClass: 'text-rose-700' };
}
