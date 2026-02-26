import { useOutletContext } from 'react-router';
import { useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Users2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function ExternalTeamsPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchReviewer, setSearchReviewer] = useState('');
  
  const chartRef2 = useRef<HTMLDivElement>(null);
  const chartRef3 = useRef<HTMLDivElement>(null);
  
  // Get unique years
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    unifiedData.forEach(course => yearSet.add(course.reportingYear));
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [unifiedData]);
  
  // Filter courses by year
  const filteredCourses = useMemo(() => {
    if (selectedYear === 'all') return unifiedData;
    return unifiedData.filter(course => course.reportingYear === parseInt(selectedYear));
  }, [unifiedData, selectedYear]);
  
  // Legal reviewers workload
  const legalReviewerData = useMemo(() => {
    const reviewerMap = new Map<string, number>();
    
    filteredCourses.forEach(course => {
      const legalKey = Object.keys(course.metadata).find(k => 
        k.toLowerCase().includes('legal') && k.toLowerCase().includes('reviewer')
      );
      if (legalKey && course.metadata[legalKey]) {
        const reviewer = String(course.metadata[legalKey]).trim();
        if (reviewer) {
          reviewerMap.set(reviewer, (reviewerMap.get(reviewer) || 0) + 1);
        }
      }
    });
    
    return Array.from(reviewerMap.entries())
      .map(([reviewer, count]) => ({ reviewer, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCourses]);
  
  // CQO time entries by year
  const cqoTimeByYear = useMemo(() => {
    const cqoCategories = [
      'CQO Review',
      'CQO',
      'Quality Review',
      'QA Testing',
      'UAT Testing'
    ];
    
    const yearCategoryMap = new Map<number, Map<string, number>>();
    
    unifiedData.forEach(course => {
      if (course.categoryBreakdown) {
        const year = course.reportingYear;
        
        if (!yearCategoryMap.has(year)) {
          yearCategoryMap.set(year, new Map());
        }
        const categoryMap = yearCategoryMap.get(year)!;
        
        course.categoryBreakdown.forEach((time, category) => {
          if (cqoCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))) {
            categoryMap.set(category, (categoryMap.get(category) || 0) + time);
          }
        });
      }
    });
    
    const result: any[] = [];
    yearCategoryMap.forEach((categoryMap, year) => {
      const dataPoint: any = { year };
      categoryMap.forEach((time, category) => {
        dataPoint[category] = parseFloat(time.toFixed(1));
      });
      result.push(dataPoint);
    });
    
    return result.sort((a, b) => a.year - b.year);
  }, [unifiedData]);
  
  // Legal review time by year
  const legalTimeByYear = useMemo(() => {
    const legalCategories = [
      'Legal Review',
      'Legal',
      'Compliance Review'
    ];
    
    const yearTimeMap = new Map<number, number>();
    
    unifiedData.forEach(course => {
      if (course.categoryBreakdown) {
        const year = course.reportingYear;
        let legalTime = 0;
        
        course.categoryBreakdown.forEach((time, category) => {
          if (legalCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))) {
            legalTime += time;
          }
        });
        
        if (legalTime > 0) {
          yearTimeMap.set(year, (yearTimeMap.get(year) || 0) + legalTime);
        }
      }
    });
    
    return Array.from(yearTimeMap.entries())
      .map(([year, time]) => ({
        year,
        time: parseFloat(time.toFixed(1))
      }))
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
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-semibold mb-2">External Teams Analytics</h2>
            <p className="text-gray-600">Legal reviewers, CQO, and external collaboration metrics</p>
          </div>
          
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year-filter">Filter by Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-filter" className="mt-1.5">
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
                
                <div className="flex items-end">
                  <div className="p-4 bg-blue-50 rounded-lg w-full">
                    <div className="flex items-center gap-2">
                      <Users2 className="size-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} in scope
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Legal Reviewers Workload - TABLE (Not Rendering) */}
          <LegalReviewerTable data={legalReviewerData} searchTerm={searchReviewer} onSearchChange={setSearchReviewer} />
          
          {/* CQO Time Entries by Year - CHART (Working) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CQO & Quality Assurance Time - Year-over-Year</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Total hours spent on quality reviews and testing across years
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChart(chartRef2, 'cqo-time-by-year.png')}
                >
                  <Download className="size-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cqoTimeByYear.length === 0 ? (
                <div className="p-8 text-center border rounded-lg bg-gray-50">
                  <p className="text-gray-600">No CQO/QA data available.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Time Spent data should include categories like CQO Review, QA Testing, or UAT Testing.
                  </p>
                </div>
              ) : (
                <>
                  <div ref={chartRef2}>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={cqoTimeByYear}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis label={{ value: 'Total Hours', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        {cqoTimeByYear.length > 0 && Object.keys(cqoTimeByYear[0])
                          .filter(key => key !== 'year')
                          .map((category, index) => (
                            <Bar 
                              key={category}
                              dataKey={category} 
                              stackId="a"
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))
                        }
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Increasing CQO time may indicate more rigorous quality standards or more complex courses requiring additional review.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Legal Review Time Trend - CHART (Working) */}
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
                  onClick={() => downloadChart(chartRef3, 'legal-time-trend.png')}
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
                <div ref={chartRef3}>
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
      </div>
    </main>
  );
}

// Legal Reviewer Table Component (Replacing non-rendering chart)
function LegalReviewerTable({ data, searchTerm, onSearchChange }: { 
  data: Array<{ reviewer: string; count: number }>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) {
  const [sortConfig, setSortConfig] = useState<{ key: 'reviewer' | 'count'; direction: 'asc' | 'desc' }>({ 
    key: 'count', 
    direction: 'desc' 
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter(row => 
        row.reviewer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortConfig.key === 'reviewer') {
        return sortConfig.direction === 'asc' 
          ? a.reviewer.localeCompare(b.reviewer)
          : b.reviewer.localeCompare(a.reviewer);
      } else {
        return sortConfig.direction === 'asc' 
          ? a.count - b.count
          : b.count - a.count;
      }
    });

    return sorted.slice(0, 20);
  }, [data, sortConfig, searchTerm]);

  const handleSort = (key: 'reviewer' | 'count') => {
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
        link.download = 'legal-reviewers-workload.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download table:', error);
      }
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: 'reviewer' | 'count' }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="size-4 ml-2 opacity-30" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="size-4 ml-2" /> : 
      <ArrowDown className="size-4 ml-2" />;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Reviewer Workload</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Number of courses reviewed by each legal reviewer
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border rounded-lg bg-gray-50">
            <p className="text-gray-600">No legal reviewer data available.</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure your data files contain a "Legal Reviewer" field.
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
            <CardTitle>Legal Reviewer Workload</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Number of courses reviewed by each legal reviewer (Top 20)
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
          placeholder="Search by reviewer name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <div ref={tableRef} className="border rounded-lg overflow-hidden bg-white p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('reviewer')}
                    className="flex items-center px-0 hover:bg-transparent"
                  >
                    Legal Reviewer
                    <SortIcon columnKey="reviewer" />
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
                filteredAndSortedData.map((row) => (
                  <TableRow key={row.reviewer}>
                    <TableCell className="font-medium">{row.reviewer}</TableCell>
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
          Showing {filteredAndSortedData.length} of {data.length} reviewers
        </p>
      </CardContent>
    </Card>
  );
}
