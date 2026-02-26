import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { X, ChevronDown } from 'lucide-react';
import { extractMetadataOptions, type UnifiedCourseData } from '../utils/csvProcessor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

interface Filters {
  searchTerm: string;
  selectedYears: number[];
  selectedStatuses: string[];
  selectedCategories: string[];
  minTime: number;
  maxTime: number;
  selectedVerticals: string[];
  selectedAuthoringTools: string[];
  selectedSMEs: string[];
  selectedLegalReviewers: string[];
  selectedCourseLengths: string[];
  selectedIDAssigned: string[];
  selectedCourseTypes: string[];
  selectedCourseStyles: string[];
}

interface FilterPanelProps {
  data: UnifiedCourseData[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

// Multi-select dropdown component
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  onClear
}: {
  label: string;
  options: string[] | number[];
  selected: (string | number)[];
  onChange: (value: string | number) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);
  
  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {selected.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="h-auto p-1 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      <div className="relative">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setOpen(!open)}
        >
          <span className="truncate">
            {selected.length === 0 
              ? `Select ${label}...`
              : `${selected.length} selected`
            }
          </span>
          <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
        
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
            <div className="p-2 space-y-1">
              {options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <div
                    key={String(option)}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(option);
                    }}
                  >
                    <Checkbox checked={isSelected} />
                    <label className="flex-1 cursor-pointer text-sm">
                      {String(option)}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FilterPanel({ data, filters, onFiltersChange }: FilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Extract unique values
  const uniqueYears = useMemo(() => {
    const years = new Set(data.map(c => c.year));
    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(data.map(c => c.status));
    return Array.from(statuses).sort();
  }, [data]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    data.forEach(course => {
      if (course.categoryBreakdown) {
        course.categoryBreakdown.forEach((_, category) => {
          categories.add(category);
        });
      }
    });
    return Array.from(categories).sort();
  }, [data]);
  
  const metadataOptions = useMemo(() => extractMetadataOptions(data), [data]);
  
  const activeFilterCount = 
    (filters.searchTerm ? 1 : 0) +
    filters.selectedYears.length +
    filters.selectedStatuses.length +
    filters.selectedCategories.length +
    (filters.minTime > 0 ? 1 : 0) +
    (filters.maxTime < Infinity ? 1 : 0) +
    filters.selectedVerticals.length +
    filters.selectedAuthoringTools.length +
    filters.selectedSMEs.length +
    filters.selectedLegalReviewers.length +
    filters.selectedCourseLengths.length +
    filters.selectedIDAssigned.length +
    filters.selectedCourseTypes.length +
    filters.selectedCourseStyles.length;
  
  const toggleFilter = (filterKey: keyof Filters, value: any) => {
    const currentValues = filters[filterKey] as any[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [filterKey]: newValues });
  };
  
  const clearFilter = (filterKey: keyof Filters) => {
    onFiltersChange({ ...filters, [filterKey]: [] });
  };
  
  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      selectedYears: [],
      selectedStatuses: [],
      selectedCategories: [],
      minTime: 0,
      maxTime: Infinity,
      selectedVerticals: [],
      selectedAuthoringTools: [],
      selectedSMEs: [],
      selectedLegalReviewers: [],
      selectedCourseLengths: [],
      selectedIDAssigned: [],
      selectedCourseTypes: [],
      selectedCourseStyles: [],
    });
  };
  
  // Get active filter badges for display
  const getActiveFilterBadges = () => {
    const badges: Array<{ label: string; value: string | number; filterKey: keyof Filters }> = [];
    
    filters.selectedYears.forEach(year => 
      badges.push({ label: 'Year', value: year, filterKey: 'selectedYears' })
    );
    filters.selectedStatuses.forEach(status => 
      badges.push({ label: 'Status', value: status, filterKey: 'selectedStatuses' })
    );
    filters.selectedCategories.forEach(category => 
      badges.push({ label: 'Category', value: category, filterKey: 'selectedCategories' })
    );
    filters.selectedVerticals.forEach(vertical => 
      badges.push({ label: 'Vertical', value: vertical, filterKey: 'selectedVerticals' })
    );
    filters.selectedAuthoringTools.forEach(tool => 
      badges.push({ label: 'Tool', value: tool, filterKey: 'selectedAuthoringTools' })
    );
    filters.selectedSMEs.forEach(sme => 
      badges.push({ label: 'SME', value: sme, filterKey: 'selectedSMEs' })
    );
    filters.selectedLegalReviewers.forEach(reviewer => 
      badges.push({ label: 'Legal', value: reviewer, filterKey: 'selectedLegalReviewers' })
    );
    filters.selectedCourseLengths.forEach(length => 
      badges.push({ label: 'Length', value: length, filterKey: 'selectedCourseLengths' })
    );
    filters.selectedIDAssigned.forEach(id => 
      badges.push({ label: 'ID', value: id, filterKey: 'selectedIDAssigned' })
    );
    filters.selectedCourseTypes.forEach(type => 
      badges.push({ label: 'Type', value: type, filterKey: 'selectedCourseTypes' })
    );
    filters.selectedCourseStyles.forEach(style => 
      badges.push({ label: 'Style', value: style, filterKey: 'selectedCourseStyles' })
    );
    
    return badges;
  };
  
  const activeFilterBadges = getActiveFilterBadges();
  
  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {activeFilterBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          {activeFilterBadges.map((badge, index) => (
            <Badge 
              key={`${badge.filterKey}-${badge.value}-${index}`}
              variant="secondary"
              className="cursor-pointer hover:bg-gray-300"
              onClick={() => toggleFilter(badge.filterKey, badge.value)}
            >
              {badge.label}: {badge.value}
              <X className="size-3 ml-1" />
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="h-6 text-xs"
          >
            Clear All
          </Button>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              {activeFilterCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</p>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="size-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search Courses</Label>
            <Input
              id="search"
              placeholder="Search by course name..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
              className="mt-1.5"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year Filter */}
            {uniqueYears.length > 0 && (
              <MultiSelectDropdown
                label="Year"
                options={uniqueYears}
                selected={filters.selectedYears}
                onChange={(value) => toggleFilter('selectedYears', value)}
                onClear={() => clearFilter('selectedYears')}
              />
            )}
            
            {/* Status Filter */}
            {uniqueStatuses.length > 0 && (
              <MultiSelectDropdown
                label="Status"
                options={uniqueStatuses}
                selected={filters.selectedStatuses}
                onChange={(value) => toggleFilter('selectedStatuses', value)}
                onClear={() => clearFilter('selectedStatuses')}
              />
            )}
            
            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <MultiSelectDropdown
                label="Category"
                options={uniqueCategories}
                selected={filters.selectedCategories}
                onChange={(value) => toggleFilter('selectedCategories', value)}
                onClear={() => clearFilter('selectedCategories')}
              />
            )}
            
            {/* ID Assigned */}
            {metadataOptions.idAssigned.length > 0 && (
              <MultiSelectDropdown
                label="ID Assigned"
                options={metadataOptions.idAssigned}
                selected={filters.selectedIDAssigned}
                onChange={(value) => toggleFilter('selectedIDAssigned', value)}
                onClear={() => clearFilter('selectedIDAssigned')}
              />
            )}
          </div>
          
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minTime">Min Hours</Label>
              <Input
                id="minTime"
                type="number"
                placeholder="0"
                value={filters.minTime > 0 ? filters.minTime : ''}
                onChange={(e) => onFiltersChange({ ...filters, minTime: parseFloat(e.target.value) || 0 })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="maxTime">Max Hours</Label>
              <Input
                id="maxTime"
                type="number"
                placeholder="∞"
                value={filters.maxTime < Infinity ? filters.maxTime : ''}
                onChange={(e) => onFiltersChange({ ...filters, maxTime: parseFloat(e.target.value) || Infinity })}
                className="mt-1.5"
              />
            </div>
          </div>
          
          {/* Advanced Filters Toggle */}
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>Advanced Filters</span>
            <ChevronDown className={`size-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>
          
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vertical */}
                {metadataOptions.verticals.length > 0 && (
                  <MultiSelectDropdown
                    label="Vertical"
                    options={metadataOptions.verticals}
                    selected={filters.selectedVerticals}
                    onChange={(value) => toggleFilter('selectedVerticals', value)}
                    onClear={() => clearFilter('selectedVerticals')}
                  />
                )}
                
                {/* Authoring Tool */}
                {metadataOptions.authoringTools.length > 0 && (
                  <MultiSelectDropdown
                    label="Authoring Tool"
                    options={metadataOptions.authoringTools}
                    selected={filters.selectedAuthoringTools}
                    onChange={(value) => toggleFilter('selectedAuthoringTools', value)}
                    onClear={() => clearFilter('selectedAuthoringTools')}
                  />
                )}
                
                {/* SME */}
                {metadataOptions.smes.length > 0 && (
                  <MultiSelectDropdown
                    label="SME"
                    options={metadataOptions.smes}
                    selected={filters.selectedSMEs}
                    onChange={(value) => toggleFilter('selectedSMEs', value)}
                    onClear={() => clearFilter('selectedSMEs')}
                  />
                )}
                
                {/* Legal Reviewer */}
                {metadataOptions.legalReviewers.length > 0 && (
                  <MultiSelectDropdown
                    label="Legal Reviewer"
                    options={metadataOptions.legalReviewers}
                    selected={filters.selectedLegalReviewers}
                    onChange={(value) => toggleFilter('selectedLegalReviewers', value)}
                    onClear={() => clearFilter('selectedLegalReviewers')}
                  />
                )}
                
                {/* Course Length */}
                {metadataOptions.courseLengths.length > 0 && (
                  <MultiSelectDropdown
                    label="Course Length"
                    options={metadataOptions.courseLengths}
                    selected={filters.selectedCourseLengths}
                    onChange={(value) => toggleFilter('selectedCourseLengths', value)}
                    onClear={() => clearFilter('selectedCourseLengths')}
                  />
                )}
                
                {/* Course Type */}
                {metadataOptions.courseTypes.length > 0 && (
                  <MultiSelectDropdown
                    label="Course Type"
                    options={metadataOptions.courseTypes}
                    selected={filters.selectedCourseTypes}
                    onChange={(value) => toggleFilter('selectedCourseTypes', value)}
                    onClear={() => clearFilter('selectedCourseTypes')}
                  />
                )}
                
                {/* Course Style */}
                {metadataOptions.courseStyles.length > 0 && (
                  <MultiSelectDropdown
                    label="Course Style"
                    options={metadataOptions.courseStyles}
                    selected={filters.selectedCourseStyles}
                    onChange={(value) => toggleFilter('selectedCourseStyles', value)}
                    onClear={() => clearFilter('selectedCourseStyles')}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}