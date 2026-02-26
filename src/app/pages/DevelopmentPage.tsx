import { useOutletContext } from 'react-router';
import { useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function DevelopmentPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const chartRef1 = useRef<HTMLDivElement>(null);
  
  // Average development time by year
  const avgDevelopmentTimeByYear = useMemo(() => {
    const yearTimeMap = new Map<number, { totalTime: number; count: number }>();
    
    unifiedData.forEach(course => {
      const year = course.reportingYear;
      
      if (!yearTimeMap.has(year)) {
        yearTimeMap.set(year, { totalTime: 0, count: 0 });
      }
      const data = yearTimeMap.get(year)!;
      data.totalTime += course.totalTime;
      data.count++;
    });
    
    return Array.from(yearTimeMap.entries())
      .map(([year, data]) => ({
        year,
        avgTime: parseFloat((data.totalTime / data.count).toFixed(1))
      }))
      .sort((a, b) => a.year - b.year);
  }, [unifiedData]);
  
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
  
  // Development categories by year
  const devCategoriesByYear = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    
    const yearCategoryMap = new Map<number, Map<string, { totalTime: number; count: number }>>();
    
    unifiedData.forEach(course => {
      if (course.categoryBreakdown) {
        const year = course.reportingYear;
        
        if (!yearCategoryMap.has(year)) {
          yearCategoryMap.set(year, new Map());
        }
        const categoryMap = yearCategoryMap.get(year)!;
        
        course.categoryBreakdown.forEach((time, category) => {
          if (selectedCategories.includes(category)) {
            if (!categoryMap.has(category)) {
              categoryMap.set(category, { totalTime: 0, count: 0 });
            }
            const data = categoryMap.get(category)!;
            data.totalTime += time;
            data.count++;
          }
        });
      }
    });
    
    const result: any[] = [];
    yearCategoryMap.forEach((categoryMap, year) => {
      const dataPoint: any = { year };
      categoryMap.forEach((data, category) => {
        dataPoint[category] = parseFloat((data.totalTime / data.count).toFixed(1));
      });
      result.push(dataPoint);
    });
    
    return result.sort((a, b) => a.year - b.year);
  }, [unifiedData, selectedCategories]);
  
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
          
          {/* Average Development Time by Year - CHART (Working) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Average Development Time by Year</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Overall average course development time across all categories
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChart(chartRef1, 'avg-development-time.png')}
                >
                  <Download className="size-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={chartRef1}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={avgDevelopmentTimeByYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'Average Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Avg Development Time (hrs)"
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Development Categories Year-over-Year - TABLE (Not Rendering) */}
          <Card>
            <CardHeader>
              <CardTitle>Development Categories Year-over-Year</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Select categories to compare average hours across years
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">Select Categories:</p>
                <div className="flex flex-wrap gap-2">
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
              </div>
              
              {selectedCategories.length > 0 && (
                <DevCategoriesTable data={devCategoriesByYear} categories={selectedCategories} />
              )}
              
              {selectedCategories.length === 0 && (
                <div className="p-8 text-center border rounded-lg bg-gray-50">
                  <p className="text-gray-600">Select categories above to see year-over-year comparison</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

// Development Categories Table Component (Replacing non-rendering chart)
function DevCategoriesTable({ data, categories }: { data: Array<any>; categories: string[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'year', 
    direction: 'asc' 
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? 0;
      const bVal = b[sortConfig.key] ?? 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
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
        link.download = 'development-categories.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download table:', error);
      }
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="size-4 ml-2 opacity-30" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="size-4 ml-2" /> : 
      <ArrowDown className="size-4 ml-2" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadTable}
        >
          <Download className="size-4 mr-2" />
          Download
        </Button>
      </div>
      <div ref={tableRef} className="border rounded-lg overflow-hidden bg-white p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('year')}
                    className="flex items-center px-0 hover:bg-transparent"
                  >
                    Year
                    <SortIcon columnKey="year" />
                  </Button>
                </TableHead>
                {categories.map(category => (
                  <TableHead key={category} className="text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort(category)}
                      className="flex items-center ml-auto px-0 hover:bg-transparent"
                    >
                      {category}
                      <SortIcon columnKey={category} />
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, idx) => (
                <TableRow key={row.year || idx}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  {categories.map(category => (
                    <TableCell key={category} className="text-right">
                      {row[category] !== undefined ? row[category] : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
