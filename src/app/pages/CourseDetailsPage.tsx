import { useOutletContext } from 'react-router';
import { useState, useMemo } from 'react';
import { CourseDataTable } from '../components/CourseDataTable';
import { FilterPanel } from '../components/FilterPanel';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
}

export default function CourseDetailsPage() {
  const { unifiedData } = useOutletContext<DashboardContext>();
  
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
  
  // Apply filters to data
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
          <div>
            <h2 className="text-3xl font-semibold mb-2">Course Details</h2>
            <p className="text-gray-600">Comprehensive view of all course data with advanced filtering</p>
          </div>
          
          <FilterPanel
            data={unifiedData}
            filters={filters}
            onFiltersChange={setFilters}
          />
          
          <CourseDataTable courses={filteredData} />
        </div>
      </div>
    </main>
  );
}
