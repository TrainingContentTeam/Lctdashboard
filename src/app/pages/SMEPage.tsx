import { useOutletContext } from 'react-router';
import { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, Users, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { toPng } from 'html-to-image';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function SMEPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();
  const [selectedSME, setSelectedSME] = useState<string>('all');
  const [selectedID, setSelectedID] = useState<string>('all');
  const [searchSME, setSearchSME] = useState('');
  
  // Get unique SMEs and IDs
  const { smes, ids } = useMemo(() => {
    const smeSet = new Set<string>();
    const idSet = new Set<string>();
    
    unifiedData.forEach(course => {
      const smeKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('sme'));
      if (smeKey && course.metadata[smeKey]) {
        const smeValue = String(course.metadata[smeKey]).trim();
        if (smeValue) smeSet.add(smeValue);
      }
      
      const idKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('id') && k.toLowerCase().includes('assigned'));
      if (idKey && course.metadata[idKey]) {
        const idValue = String(course.metadata[idKey]).trim();
        if (idValue) idSet.add(idValue);
      }
    });
    
    return {
      smes: Array.from(smeSet).sort(),
      ids: Array.from(idSet).sort()
    };
  }, [unifiedData]);
  
  // Filter courses by SME and ID
  const filteredCourses = useMemo(() => {
    return unifiedData.filter(course => {
      if (selectedSME !== 'all') {
        const smeKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('sme'));
        const sme = smeKey ? String(course.metadata[smeKey]).trim() : '';
        if (sme !== selectedSME) return false;
      }
      
      if (selectedID !== 'all') {
        const idKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('id') && k.toLowerCase().includes('assigned'));
        const id = idKey ? String(course.metadata[idKey]).trim() : '';
        if (id !== selectedID) return false;
      }
      
      return true;
    });
  }, [unifiedData, selectedSME, selectedID]);
  
  // SME initial phases time by year
  const smePhasesByYear = useMemo(() => {
    const initialPhases = [
      'LP Outline Development',
      'LP Development',
      'ID Review of LP'
    ];
    
    const yearPhaseMap = new Map<number, Map<string, { totalTime: number; count: number }>>();
    
    filteredCourses.forEach(course => {
      if (course.categoryBreakdown) {
        const year = course.reportingYear;
        
        if (!yearPhaseMap.has(year)) {
          yearPhaseMap.set(year, new Map());
        }
        const phaseMap = yearPhaseMap.get(year)!;
        
        course.categoryBreakdown.forEach((time, category) => {
          if (initialPhases.includes(category)) {
            if (!phaseMap.has(category)) {
              phaseMap.set(category, { totalTime: 0, count: 0 });
            }
            const data = phaseMap.get(category)!;
            data.totalTime += time;
            data.count += 1;
          }
        });
      }
    });
    
    const result: any[] = [];
    yearPhaseMap.forEach((phaseMap, year) => {
      const dataPoint: any = { year };
      phaseMap.forEach((data, phase) => {
        dataPoint[phase] = parseFloat((data.totalTime / data.count).toFixed(1));
      });
      result.push(dataPoint);
    });
    
    return result.sort((a, b) => a.year - b.year);
  }, [filteredCourses]);
  
  // Courses by SME
  const coursesBySME = useMemo(() => {
    const smeMap = new Map<string, number>();
    
    unifiedData.forEach(course => {
      const smeKey = Object.keys(course.metadata).find(k => k.toLowerCase().includes('sme'));
      if (smeKey && course.metadata[smeKey]) {
        const sme = String(course.metadata[smeKey]).trim();
        if (sme) {
          smeMap.set(sme, (smeMap.get(sme) || 0) + 1);
        }
      }
    });
    
    return Array.from(smeMap.entries())
      .map(([sme, count]) => ({ sme, count }))
      .sort((a, b) => b.count - a.count);
  }, [unifiedData]);
  
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-semibold mb-2">SME Collaboration Analytics</h2>
            <p className="text-gray-600">Track SME engagement and efficiency in initial development phases</p>
          </div>
          
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sme-filter">Filter by SME</Label>
                  <Select value={selectedSME} onValueChange={setSelectedSME}>
                    <SelectTrigger id="sme-filter" className="mt-1.5">
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
                  <Label htmlFor="id-filter">Filter by ID Assigned</Label>
                  <Select value={selectedID} onValueChange={setSelectedID}>
                    <SelectTrigger id="id-filter" className="mt-1.5">
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
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Initial Development Phases Year-over-Year - TABLE (Not Rendering) */}
          <SMEPhasesTable data={smePhasesByYear} />
          
          {/* Top SMEs by Course Count - TABLE (Not Rendering) */}
          <TopSMEsTable data={coursesBySME} searchTerm={searchSME} onSearchChange={setSearchSME} />
        </div>
      </div>
    </main>
  );
}

// SME Phases Table Component (Replacing non-rendering chart)
function SMEPhasesTable({ data }: { data: Array<any> }) {
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
        link.download = 'sme-phases.png';
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

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initial Development Phases - Year-over-Year</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Average time spent in LP Outline, LP Development, and ID Review phases
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border rounded-lg bg-gray-50">
            <p className="text-gray-600">No phase breakdown data available.</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure your Time Spent data includes LP Outline Development, LP Development, and ID Review of LP categories.
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
            <CardTitle>Initial Development Phases - Year-over-Year</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Average time spent in LP Outline, LP Development, and ID Review phases (in hours)
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
        <div ref={tableRef} className="border rounded-lg overflow-hidden bg-white p-4">
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
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('LP Outline Development')}
                    className="flex items-center ml-auto px-0 hover:bg-transparent"
                  >
                    LP Outline Dev
                    <SortIcon columnKey="LP Outline Development" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('LP Development')}
                    className="flex items-center ml-auto px-0 hover:bg-transparent"
                  >
                    LP Development
                    <SortIcon columnKey="LP Development" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('ID Review of LP')}
                    className="flex items-center ml-auto px-0 hover:bg-transparent"
                  >
                    ID Review of LP
                    <SortIcon columnKey="ID Review of LP" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, idx) => (
                <TableRow key={row.year || idx}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right">
                    {row['LP Outline Development'] !== undefined ? row['LP Outline Development'] : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row['LP Development'] !== undefined ? row['LP Development'] : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row['ID Review of LP'] !== undefined ? row['ID Review of LP'] : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Insight:</strong> Decreasing trends indicate improved SME collaboration and efficiency. 
            Higher ID Review times may suggest more complex courses or additional review cycles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Top SMEs Table Component (Replacing non-rendering chart)
function TopSMEsTable({ data, searchTerm, onSearchChange }: { 
  data: Array<{ sme: string; count: number }>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) {
  const [sortConfig, setSortConfig] = useState<{ key: 'sme' | 'count'; direction: 'asc' | 'desc' }>({ 
    key: 'count', 
    direction: 'desc' 
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter(row => 
        row.sme.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortConfig.key === 'sme') {
        return sortConfig.direction === 'asc' 
          ? a.sme.localeCompare(b.sme)
          : b.sme.localeCompare(a.sme);
      } else {
        return sortConfig.direction === 'asc' 
          ? a.count - b.count
          : b.count - a.count;
      }
    });

    return sorted.slice(0, 20);
  }, [data, sortConfig, searchTerm]);

  const handleSort = (key: 'sme' | 'count') => {
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
        link.download = 'top-smes.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download table:', error);
      }
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: 'sme' | 'count' }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="size-4 ml-2 opacity-30" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="size-4 ml-2" /> : 
      <ArrowDown className="size-4 ml-2" />;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top SMEs by Course Count</CardTitle>
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
            <CardTitle>Top SMEs by Course Count</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Most active SMEs across all projects (Top 20)
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
          placeholder="Search by SME name..."
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
                    onClick={() => handleSort('sme')}
                    className="flex items-center px-0 hover:bg-transparent"
                  >
                    SME
                    <SortIcon columnKey="sme" />
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
                  <TableRow key={row.sme}>
                    <TableCell className="font-medium">{row.sme}</TableCell>
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
          Showing {filteredAndSortedData.length} of {data.length} SMEs
        </p>
      </CardContent>
    </Card>
  );
}
