import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { UnifiedCourseData } from '../utils/csvProcessor';

interface CourseDataTableProps {
  courses: UnifiedCourseData[];
}

export function CourseDataTable({ courses }: CourseDataTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('totalTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const sortedCourses = useMemo(() => {
    const sorted = [...courses];
    
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortColumn) {
        case 'courseName':
          aVal = a.courseName.toLowerCase();
          bVal = b.courseName.toLowerCase();
          break;
        case 'totalTime':
          aVal = a.totalTime;
          bVal = b.totalTime;
          break;
        case 'year':
          aVal = a.year;
          bVal = b.year;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [courses, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const toggleExpand = (courseKey: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseKey)) {
        newSet.delete(courseKey);
      } else {
        newSet.add(courseKey);
      }
      return newSet;
    });
  };

  if (courses.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No courses match the current filters</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Course Details ({sortedCourses.length})</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Button
              variant={sortColumn === 'courseName' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('courseName')}
            >
              Name
            </Button>
            <Button
              variant={sortColumn === 'totalTime' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('totalTime')}
            >
              Time
            </Button>
            <Button
              variant={sortColumn === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('year')}
            >
              Year
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="min-w-[250px]">Course Name</TableHead>
                    <TableHead className="w-[100px]">Year</TableHead>
                    <TableHead className="w-[120px] text-right">Time (hrs)</TableHead>
                    <TableHead className="w-[160px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No courses match the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCourses.flatMap((course) => {
                      // Create unique key combining course name and year
                      const courseKey = `${course.normalizedCourseName}__${course.reportingYear}`;
                      const isExpanded = expandedRows.has(courseKey);
                      const hasCategories = course.categoryBreakdown && course.categoryBreakdown.size > 0;
                      
                      const rows = [
                        <TableRow key={courseKey} className="hover:bg-gray-50">
                          <TableCell>
                            {hasCategories && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(courseKey)}
                                className="p-0 h-8 w-8"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="max-w-[250px] truncate" title={course.courseName}>
                              {course.courseName}
                            </div>
                          </TableCell>
                          <TableCell>{course.year}</TableCell>
                          <TableCell className="text-right font-mono">
                            {course.totalTime.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Badge variant={
                                    course.classification === 'Legacy' ? 'default' :
                                    course.classification === 'Modern' ? 'secondary' :
                                    'outline'
                                  }>
                                    {course.classification}
                                  </Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {course.classification === 'Legacy' && (
                                  <p>Courses from 2022-2025 using legacy Wrike infrastructure</p>
                                )}
                                {course.classification === 'Modern' && (
                                  <p>Courses using updated record infrastructure in Wrike (2026+)</p>
                                )}
                                {course.classification === 'In Progress' && (
                                  <p>Currently in progress, not yet completed</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ];
                      
                      if (isExpanded && hasCategories) {
                        rows.push(
                          <TableRow key={`${courseKey}-expanded`}>
                            <TableCell></TableCell>
                            <TableCell colSpan={4}>
                              <div className="py-2 pl-4">
                                <p className="text-sm font-medium mb-2">Category Breakdown:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {Array.from(course.categoryBreakdown!.entries()).map(([category, time]) => (
                                    <div
                                      key={category}
                                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm"
                                    >
                                      <span className="text-gray-700">{category}</span>
                                      <span className="font-mono font-medium">{time.toFixed(1)}h</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      return rows;
                    })
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}