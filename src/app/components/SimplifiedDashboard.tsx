import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import type { UnifiedCourseData } from '../utils/csvProcessor';
import { useRef, useState, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

interface SimplifiedDashboardProps {
  courses: UnifiedCourseData[];
  lastUpdated: Date | null;
}

export function SimplifiedDashboard({ courses, lastUpdated }: SimplifiedDashboardProps) {
  // Prepare data for charts
  const coursesByYearData = prepareCoursesByYearData(courses);
  const coursesByIDData = prepareCoursesByIDData(courses);
  const avgTimeByDevelopmentCategoryData = prepareAvgTimeByDevelopmentCategory(courses);
  
  const chartRef1 = useRef<HTMLDivElement>(null);
  const chartRef3 = useRef<HTMLDivElement>(null);
  
  const downloadChart = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (ref.current) {
      try {
        const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download chart:', error);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Last Updated Banner */}
      {lastUpdated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Data Last Updated:</strong> {lastUpdated.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
      )}
      
      {/* Courses by Year - CHART (Working) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Courses by Year</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Showing completed (Published/Completed status) vs in-progress courses
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloadChart(chartRef1, 'courses-by-year.png')}
            >
              <Download className="size-4 mr-2" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef1}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={coursesByYearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                <Bar dataKey="inProgress" fill="#10b981" name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Courses by ID Assigned - CHART */}
      <CoursesByIDChart data={coursesByIDData} />
      
      {/* Average Time by Development Category - CHART (Working) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Average Time in Key Development Categories</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Average hours spent in Rise, Storyline, LP Development, and Testing
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloadChart(chartRef3, 'avg-time-by-category.png')}
            >
              <Download className="size-4 mr-2" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {avgTimeByDevelopmentCategoryData.length === 0 ? (
            <div className="p-8 text-center border rounded-lg bg-gray-50">
              <p className="text-gray-600">No category breakdown data available.</p>
            </div>
          ) : (
            <div ref={chartRef3}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={avgTimeByDevelopmentCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: 'Average Hours', position: 'bottom' }} />
                  <YAxis dataKey="category" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="avgTime" fill="#8b5cf6" name="Avg Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CoursesByIDChart({ data }: { data: Array<{ id: string; completed: number; inProgress: number; total: number }> }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);
  const hasInitializedSelection = useRef(false);

  useEffect(() => {
    const availableIds = data.map(row => row.id);
    setSelectedIds(prev => {
      if (!hasInitializedSelection.current) {
        hasInitializedSelection.current = true;
        return availableIds;
      }
      return prev.filter(id => availableIds.includes(id));
    });
  }, [data]);

  const filteredIdOptions = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row => row.id.toLowerCase().includes(term));
  }, [data, searchTerm]);

  const selectedData = useMemo(() => {
    return data.filter(row => selectedIds.includes(row.id));
  }, [data, selectedIds]);

  const toggleIdSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    );
  };

  const selectAllIds = () => setSelectedIds(data.map(row => row.id));
  const clearAllIds = () => setSelectedIds([]);

  const downloadChart = async () => {
    if (chartRef.current) {
      try {
        const dataUrl = await toPng(chartRef.current, { backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = 'courses-by-id-assigned.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download chart:', error);
      }
    }
  };

  const chartHeight = Math.max(350, selectedData.length * 40);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Courses by ID Assigned</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Distribution of courses across team members
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border rounded-lg bg-gray-50">
            <p className="text-gray-600">No ID assignment data available.</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure your data files contain an "ID Assigned" field.
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
            <CardTitle>Courses by ID Assigned</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Completed vs in-progress course counts by ID
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
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
            <Input
              placeholder="Search ID assigned..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllIds}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllIds}>
                Clear all
              </Button>
            </div>
            <ScrollArea className="h-64 rounded border bg-white p-2">
              <div className="space-y-1">
                {filteredIdOptions.length > 0 ? (
                  filteredIdOptions.map((row) => {
                    const isChecked = selectedIds.includes(row.id);
                    return (
                      <button
                        type="button"
                        key={row.id}
                        onClick={() => toggleIdSelection(row.id)}
                        className="w-full flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-gray-100 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox checked={isChecked} />
                          <span className="truncate text-sm">{row.id}</span>
                        </div>
                        <span className="text-xs text-gray-500">{row.total}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 px-2 py-4">No IDs match "{searchTerm}"</p>
                )}
              </div>
            </ScrollArea>
            <p className="text-xs text-gray-600">
              Showing {selectedIds.length} of {data.length} IDs
            </p>
          </div>

          <div ref={chartRef} className="border rounded-lg p-3 bg-white">
            {selectedData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-gray-500 text-sm">
                Select at least one ID to display the chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={selectedData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="id" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" stackId="courses" fill="#3b82f6" name="Completed" />
                  <Bar dataKey="inProgress" stackId="courses" fill="#10b981" name="In Progress" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions to prepare data
function prepareCoursesByYearData(courses: UnifiedCourseData[]) {
  const yearMap = new Map<number, { completed: number; inProgress: number }>();
  
  courses.forEach(course => {
    const year = course.year;
    const existing = yearMap.get(year) || { completed: 0, inProgress: 0 };
    
    const isCompleted = isCourseCompleted(course);
    
    if (isCompleted) {
      existing.completed++;
    } else {
      existing.inProgress++;
    }
    
    yearMap.set(year, existing);
  });
  
  return Array.from(yearMap.entries())
    .map(([year, data]) => ({ year, ...data }))
    .sort((a, b) => a.year - b.year);
}

function prepareCoursesByIDData(courses: UnifiedCourseData[]) {
  const idMap = new Map<string, { completed: number; inProgress: number }>();
  
  courses.forEach(course => {
    const idAssigned = getAssignedId(course);

    if (idAssigned) {
      const existing = idMap.get(idAssigned) || { completed: 0, inProgress: 0 };
      if (isCourseCompleted(course)) {
        existing.completed += 1;
      } else {
        existing.inProgress += 1;
      }
      idMap.set(idAssigned, existing);
    }
  });
  
  return Array.from(idMap.entries())
    .map(([id, counts]) => ({
      id,
      completed: counts.completed,
      inProgress: counts.inProgress,
      total: counts.completed + counts.inProgress
    }))
    .sort((a, b) => b.total - a.total);
}

function getAssignedId(course: UnifiedCourseData): string | null {
  const idKey = Object.keys(course.metadata).find(key => {
    const lower = key.toLowerCase();
    return lower.includes('id') && lower.includes('assigned');
  });

  if (!idKey) return null;
  const value = course.metadata[idKey];
  if (!value || String(value).trim() === '') return null;
  return String(value).trim();
}

function isCourseCompleted(course: UnifiedCourseData): boolean {
  const metadataStatusKey = Object.keys(course.metadata).find(
    key => key.toLowerCase() === 'status'
  );
  const status = metadataStatusKey ? course.metadata[metadataStatusKey] : course.status;
  const normalizedStatus = String(status || '').toLowerCase();
  return normalizedStatus.includes('completed') || normalizedStatus.includes('published');
}

function prepareAvgTimeByDevelopmentCategory(courses: UnifiedCourseData[]) {
  const keyCategories = [
    'Rise Development',
    'Storyline Development',
    'LP Development',
    'Testing',
    'QA Testing',
    'UAT Testing'
  ];
  
  const categoryData = new Map<string, { totalTime: number; count: number }>();
  
  courses.forEach(course => {
    if (course.categoryBreakdown) {
      course.categoryBreakdown.forEach((time, category) => {
        const matchingKey = keyCategories.find(key => 
          category.toLowerCase().includes(key.toLowerCase())
        );
        
        if (matchingKey) {
          const existing = categoryData.get(matchingKey) || { totalTime: 0, count: 0 };
          existing.totalTime += time;
          existing.count++;
          categoryData.set(matchingKey, existing);
        }
      });
    }
  });
  
  return Array.from(categoryData.entries())
    .map(([category, data]) => ({
      category,
      avgTime: data.count > 0 ? parseFloat((data.totalTime / data.count).toFixed(2)) : 0
    }))
    .filter(item => item.avgTime > 0);
}
