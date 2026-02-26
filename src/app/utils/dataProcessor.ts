import * as XLSX from 'xlsx';

export interface TimeEntry {
  date?: string;
  projectId?: string;
  projectName?: string;
  mainGroupedTaskName?: string;
  category?: string;
  member?: string;
  hours?: number;
  description?: string;
  [key: string]: any;
}

export interface ProjectDetail {
  projectId?: string;
  projectName?: string;
  title?: string;
  client?: string;
  budget?: number;
  rate?: number;
  status?: string;
  year?: number;
  [key: string]: any;
}

export interface ProcessedData {
  timeEntries: TimeEntry[];
  projectDetails: ProjectDetail[];
  mergedData: Array<TimeEntry & ProjectDetail>;
}

export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

export function normalizeKeys(data: any[]): any[] {
  return data.map(row => {
    const normalized: any = {};
    
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
      
      // Map common column names to standardized keys
      if (lowerKey.includes('date')) {
        normalized.date = formatDate(row[key]);
      } else if (lowerKey === 'main grouped task name' || lowerKey.includes('main grouped')) {
        normalized.mainGroupedTaskName = String(row[key]).trim();
      } else if (lowerKey === 'title') {
        normalized.title = String(row[key]).trim();
      } else if (lowerKey.includes('category')) {
        normalized.category = String(row[key]).trim();
      } else if (lowerKey.includes('project') && lowerKey.includes('id')) {
        normalized.projectId = String(row[key]).trim();
      } else if (lowerKey.includes('project') && lowerKey.includes('name')) {
        normalized.projectName = String(row[key]).trim();
      } else if (lowerKey.includes('project') && !normalized.projectId && !normalized.projectName) {
        normalized.projectName = String(row[key]).trim();
      } else if (lowerKey.includes('member') || lowerKey.includes('employee')) {
        normalized.member = String(row[key]).trim();
      } else if (lowerKey.includes('hour')) {
        normalized.hours = parseFloat(row[key]) || 0;
      } else if (lowerKey.includes('description') || lowerKey.includes('task')) {
        normalized.description = String(row[key]).trim();
      } else if (lowerKey.includes('client')) {
        normalized.client = String(row[key]).trim();
      } else if (lowerKey.includes('budget')) {
        normalized.budget = parseFloat(row[key]) || 0;
      } else if (lowerKey.includes('rate')) {
        normalized.rate = parseFloat(row[key]) || 0;
      } else if (lowerKey.includes('status')) {
        normalized.status = String(row[key]).trim();
      } else if (lowerKey.includes('year')) {
        normalized.year = parseInt(row[key]) || 0;
      } else {
        // Keep original key-value pair
        normalized[key] = row[key];
      }
    });
    
    return normalized;
  });
}

function formatDate(dateValue: any): string {
  if (!dateValue) return '';
  
  // If it's already a string in a reasonable format
  if (typeof dateValue === 'string') {
    return dateValue;
  }
  
  // If it's an Excel serial date number
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  
  return String(dateValue);
}

export function mergeData(
  timeEntries: TimeEntry[],
  projectDetails: ProjectDetail[]
): Array<TimeEntry & ProjectDetail> {
  return timeEntries.map(entry => {
    // Match using "Main Grouped Task name" (timeEntries) with "title" (projectDetails)
    const project = projectDetails.find(p => 
      (entry.mainGroupedTaskName && p.title && entry.mainGroupedTaskName === p.title) ||
      (entry.projectId && p.projectId && entry.projectId === p.projectId) ||
      (entry.projectName && p.projectName && entry.projectName === p.projectName)
    );
    
    if (project) {
      return { ...entry, ...project };
    }
    
    return entry;
  });
}

export function calculateAnalytics(mergedData: Array<TimeEntry & ProjectDetail>) {
  const totalHours = mergedData.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Hours by project
  const projectHoursMap = new Map<string, { hours: number; budget?: number }>();
  mergedData.forEach(entry => {
    const projectName = entry.projectName || 'Unknown Project';
    const current = projectHoursMap.get(projectName) || { hours: 0 };
    current.hours += entry.hours || 0;
    if (entry.budget) {
      current.budget = entry.budget;
    }
    projectHoursMap.set(projectName, current);
  });
  
  const hoursByProject = Array.from(projectHoursMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.hours - a.hours);
  
  // Hours by member
  const memberHoursMap = new Map<string, number>();
  mergedData.forEach(entry => {
    const member = entry.member || 'Unknown';
    memberHoursMap.set(member, (memberHoursMap.get(member) || 0) + (entry.hours || 0));
  });
  
  const hoursByMember = Array.from(memberHoursMap.entries())
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours);
  
  // Hours over time
  const dateHoursMap = new Map<string, number>();
  mergedData.forEach(entry => {
    if (entry.date) {
      dateHoursMap.set(entry.date, (dateHoursMap.get(entry.date) || 0) + (entry.hours || 0));
    }
  });
  
  const hoursOverTime = Array.from(dateHoursMap.entries())
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Project status
  const statusMap = new Map<string, number>();
  const uniqueProjects = new Set(mergedData.map(e => e.projectName).filter(Boolean));
  
  mergedData.forEach(entry => {
    if (entry.status && entry.projectName) {
      if (!statusMap.has(entry.status)) {
        statusMap.set(entry.status, 0);
      }
    }
  });
  
  // Count unique projects per status
  const projectsByStatus = new Map<string, Set<string>>();
  mergedData.forEach(entry => {
    if (entry.status && entry.projectName) {
      if (!projectsByStatus.has(entry.status)) {
        projectsByStatus.set(entry.status, new Set());
      }
      projectsByStatus.get(entry.status)?.add(entry.projectName);
    }
  });
  
  const projectStatus = Array.from(projectsByStatus.entries())
    .map(([name, projects]) => ({ name, value: projects.size }));
  
  if (projectStatus.length === 0) {
    projectStatus.push({ name: 'Active', value: uniqueProjects.size });
  }
  
  // Total revenue
  const totalRevenue = mergedData.reduce((sum, entry) => {
    if (entry.hours && entry.rate) {
      return sum + (entry.hours * entry.rate);
    }
    return sum;
  }, 0);
  
  const totalProjects = uniqueProjects.size;
  const averageHoursPerProject = totalProjects > 0 ? totalHours / totalProjects : 0;
  
  return {
    totalHours,
    totalProjects,
    totalRevenue,
    averageHoursPerProject,
    hoursByProject,
    hoursByMember,
    hoursOverTime,
    projectStatus
  };
}

export function calculateCourseAnalytics(mergedData: Array<TimeEntry & ProjectDetail>) {
  // Get unique courses (using title from project details)
  const uniqueCourses = new Set(
    mergedData
      .filter(entry => entry.title)
      .map(entry => entry.title)
  );
  
  // Courses per year
  const coursesPerYearMap = new Map<number, Set<string>>();
  mergedData.forEach(entry => {
    if (entry.title && entry.year) {
      if (!coursesPerYearMap.has(entry.year)) {
        coursesPerYearMap.set(entry.year, new Set());
      }
      coursesPerYearMap.get(entry.year)?.add(entry.title!);
    }
  });
  
  const coursesPerYear = Array.from(coursesPerYearMap.entries())
    .map(([year, courses]) => ({ year, count: courses.size }))
    .sort((a, b) => a.year - b.year);
  
  // Average time per category across all courses
  const categoryHoursMap = new Map<string, number[]>();
  const courseSet = new Set<string>();
  
  mergedData.forEach(entry => {
    if (entry.title && entry.category && entry.hours) {
      courseSet.add(entry.title);
      if (!categoryHoursMap.has(entry.category)) {
        categoryHoursMap.set(entry.category, []);
      }
      categoryHoursMap.get(entry.category)?.push(entry.hours);
    }
  });
  
  const avgTimePerCategory = Array.from(categoryHoursMap.entries())
    .map(([category, hours]) => {
      const totalHours = hours.reduce((sum, h) => sum + h, 0);
      const avgPerEntry = hours.length > 0 ? totalHours / hours.length : 0;
      const totalByCourse = courseSet.size > 0 ? totalHours / courseSet.size : 0;
      return {
        category,
        totalHours,
        avgPerEntry,
        avgPerCourse: totalByCourse,
        entryCount: hours.length
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);
  
  // Total hours per course
  const courseHoursMap = new Map<string, number>();
  mergedData.forEach(entry => {
    if (entry.title && entry.hours) {
      courseHoursMap.set(
        entry.title,
        (courseHoursMap.get(entry.title) || 0) + entry.hours
      );
    }
  });
  
  const hoursPerCourse = Array.from(courseHoursMap.entries())
    .map(([course, hours]) => ({ course, hours }))
    .sort((a, b) => b.hours - a.hours);
  
  // Average hours per course (overall)
  const totalCourseHours = Array.from(courseHoursMap.values()).reduce((sum, h) => sum + h, 0);
  const avgHoursPerCourse = courseHoursMap.size > 0 ? totalCourseHours / courseHoursMap.size : 0;
  
  // Category distribution (what % of time goes to each category)
  const totalHours = mergedData.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const categoryDistribution = avgTimePerCategory.map(cat => ({
    category: cat.category,
    hours: cat.totalHours,
    percentage: totalHours > 0 ? (cat.totalHours / totalHours) * 100 : 0
  }));
  
  // Courses by year with details
  const coursesByYear = Array.from(coursesPerYearMap.entries())
    .map(([year, courses]) => {
      const yearCourses = Array.from(courses).map(courseName => {
        const courseData = mergedData.filter(e => e.title === courseName && e.year === year);
        const totalHours = courseData.reduce((sum, e) => sum + (e.hours || 0), 0);
        return { courseName, totalHours };
      });
      return { year, courses: yearCourses, count: courses.size };
    })
    .sort((a, b) => a.year - b.year);
  
  return {
    totalCourses: uniqueCourses.size,
    coursesPerYear,
    avgTimePerCategory,
    avgHoursPerCourse,
    hoursPerCourse: hoursPerCourse.slice(0, 10), // Top 10 courses
    categoryDistribution,
    coursesByYear
  };
}