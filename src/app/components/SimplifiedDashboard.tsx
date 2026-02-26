import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { UnifiedCourseData } from '../utils/csvProcessor';
import { useRef, useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';

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
      
      {/* Courses by ID Assigned - TABLE (Not Rendering) */}
      <CoursesByIDTable data={coursesByIDData} />
      
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

// Courses by ID Table Component (Replacing non-rendering chart)
function CoursesByIDTable({ data }: { data: Array<{ id: string; count: number }> }) {
  const [sortConfig, setSortConfig] = useState<{ key: 'id' | 'count'; direction: 'asc' | 'desc' }>({ 
    key: 'count', 
    direction: 'desc' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter(row => 
        row.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortConfig.key === 'id') {
        return sortConfig.direction === 'asc' 
          ? a.id.localeCompare(b.id)
          : b.id.localeCompare(a.id);
      } else {
        return sortConfig.direction === 'asc' 
          ? a.count - b.count
          : b.count - a.count;
      }
    });

    return sorted;
  }, [data, sortConfig, searchTerm]);

  const handleSort = (key: 'id' | 'count') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const downloadTable = async () => {
    if (tableRef.current) {
      try {
        const dataUrl = await toPng(tableRef.current, { backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = 'courses-by-id.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download table:', error);
      }
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: 'id' | 'count' }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="size-4 ml-2 opacity-30" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="size-4 ml-2" /> : 
      <ArrowDown className="size-4 ml-2" />;
  };

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
              Distribution of courses across team members (Top 15)
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadTable}
          >
            <Download className="size-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by ID name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div ref={tableRef} className="border rounded-lg overflow-hidden bg-white p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('id')}
                    className="flex items-center px-0 hover:bg-transparent"
                  >
                    ID Assigned
                    <SortIcon columnKey="id" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('count')}
                    className="flex items-center ml-auto px-0 hover:bg-transparent"
                  >
                    Course Count
                    <SortIcon columnKey="count" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.length > 0 ? (
                filteredAndSortedData.slice(0, 15).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.id}</TableCell>
                    <TableCell className="text-right text-lg font-semibold">{row.count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                    No results found for "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-gray-500">
          Showing {Math.min(filteredAndSortedData.length, 15)} of {data.length} IDs
        </p>
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
    
    const status = course.metadata['Status'] || course.status || '';
    const isCompleted = status.toLowerCase().includes('completed') || 
                       status.toLowerCase().includes('published');
    
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
  const idMap = new Map<string, number>();
  
  courses.forEach(course => {
    const idKey = Object.keys(course.metadata).find(k => {
      const lower = k.toLowerCase();
      return lower.includes('id') && lower.includes('assigned');
    });
    
    const idAssigned = idKey ? course.metadata[idKey] : null;
    
    if (idAssigned && String(idAssigned).trim() !== '') {
      const cleanId = String(idAssigned).trim();
      idMap.set(cleanId, (idMap.get(cleanId) || 0) + 1);
    }
  });
  
  return Array.from(idMap.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
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
