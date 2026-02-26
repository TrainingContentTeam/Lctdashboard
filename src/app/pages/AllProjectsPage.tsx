import { useOutletContext, Link } from 'react-router';
import { useState, useMemo } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Search, Clock, Calendar, Filter } from 'lucide-react';
import { FilterPanel } from '../components/FilterPanel';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function AllProjectsPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedYears: [] as number[],
    selectedStatuses: [] as string[],
    selectedCategories: [] as string[],
    minTime: 0,
    maxTime: Infinity,
    selectedVerticals: [] as string[],
    selectedAuthoringTools: [] as string[],
    selectedSMEs: [] as string[],
    selectedLegalReviewers: [] as string[],
    selectedCourseLengths: [] as string[],
    selectedIDAssigned: [] as string[],
    selectedCourseTypes: [] as string[],
    selectedCourseStyles: [] as string[],
  });
  
  const filteredData = useMemo(() => {
    return unifiedData.filter(course => {
      if (filters.searchTerm && !course.courseName.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.selectedYears.length > 0 && !filters.selectedYears.includes(course.year)) {
        return false;
      }
      if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes(course.status)) {
        return false;
      }
      if (filters.selectedCategories.length > 0) {
        const courseCategories = course.categoryBreakdown ? Array.from(course.categoryBreakdown.keys()) : [];
        const hasSelectedCategory = filters.selectedCategories.some(cat => courseCategories.includes(cat));
        if (!hasSelectedCategory) return false;
      }
      if (course.totalTime < filters.minTime || course.totalTime > filters.maxTime) {
        return false;
      }
      
      const metadata = course.metadata;
      if (filters.selectedVerticals.length > 0) {
        const verticalKey = Object.keys(metadata).find(k => k.toLowerCase().includes('vertical'));
        const vertical = verticalKey ? String(metadata[verticalKey]).trim() : '';
        if (!filters.selectedVerticals.includes(vertical)) return false;
      }
      if (filters.selectedAuthoringTools.length > 0) {
        const toolKey = Object.keys(metadata).find(k => k.toLowerCase().includes('authoring') && k.toLowerCase().includes('tool'));
        const tool = toolKey ? String(metadata[toolKey]).trim() : '';
        if (!filters.selectedAuthoringTools.includes(tool)) return false;
      }
      if (filters.selectedSMEs.length > 0) {
        const smeKey = Object.keys(metadata).find(k => k.toLowerCase().includes('sme'));
        const sme = smeKey ? String(metadata[smeKey]).trim() : '';
        if (!filters.selectedSMEs.includes(sme)) return false;
      }
      if (filters.selectedLegalReviewers.length > 0) {
        const legalKey = Object.keys(metadata).find(k => k.toLowerCase().includes('legal') && k.toLowerCase().includes('reviewer'));
        const legal = legalKey ? String(metadata[legalKey]).trim() : '';
        if (!filters.selectedLegalReviewers.includes(legal)) return false;
      }
      if (filters.selectedCourseLengths.length > 0) {
        const lengthKey = Object.keys(metadata).find(k => k.toLowerCase().includes('course') && k.toLowerCase().includes('length'));
        const length = lengthKey ? String(metadata[lengthKey]).trim() : '';
        if (!filters.selectedCourseLengths.includes(length)) return false;
      }
      if (filters.selectedIDAssigned.length > 0) {
        const idKey = Object.keys(metadata).find(k => k.toLowerCase().includes('id') && k.toLowerCase().includes('assigned'));
        const id = idKey ? String(metadata[idKey]).trim() : '';
        if (!filters.selectedIDAssigned.includes(id)) return false;
      }
      if (filters.selectedCourseTypes.length > 0) {
        const typeKey = Object.keys(metadata).find(k => k.toLowerCase().includes('course') && k.toLowerCase().includes('type'));
        const type = typeKey ? String(metadata[typeKey]).trim() : '';
        if (!filters.selectedCourseTypes.includes(type)) return false;
      }
      if (filters.selectedCourseStyles.length > 0) {
        const styleKey = Object.keys(metadata).find(k => k.toLowerCase().includes('course') && k.toLowerCase().includes('style'));
        const style = styleKey ? String(metadata[styleKey]).trim() : '';
        if (!filters.selectedCourseStyles.includes(style)) return false;
      }
      
      return true;
    });
  }, [unifiedData, filters]);
  
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold mb-2">All Projects</h2>
              <p className="text-gray-600">{filteredData.length} of {unifiedData.length} courses</p>
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="size-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input
              placeholder="Search projects by name..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
          
          {showFilters && (
            <FilterPanel
              data={unifiedData}
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((course) => {
              // Create unique key combining course name and year
              const courseKey = `${course.normalizedCourseName}__${course.reportingYear}`;
              
              return (
                <Link
                  key={courseKey}
                  to={`/projects/${encodeURIComponent(course.courseName)}/${course.reportingYear}`}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium line-clamp-2 min-h-[3rem]">{course.courseName}</h3>
                        <Badge variant="outline" className="mt-2">
                          {course.classification}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4" />
                          <span>{course.totalTime.toFixed(1)} hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4" />
                          <span>{course.year}</span>
                        </div>
                      </div>
                      
                      {course.categoryBreakdown && course.categoryBreakdown.size > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500">
                            {course.categoryBreakdown.size} time {course.categoryBreakdown.size === 1 ? 'category' : 'categories'}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
          
          {filteredData.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No projects found matching your filters.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}