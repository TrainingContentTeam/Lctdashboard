import * as XLSX from 'xlsx';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LegacyCourseRecord {
  courseName: string;
  totalTime: number;
  year?: number;
  completedDate?: string;
  status?: string;
  vertical?: string;
  authoringTool?: string;
  sme?: string;
  legalReviewer?: string;
  courseLength?: string;
  interactionCount?: number;
  [key: string]: any;
}

export interface ModernCourseRecord {
  courseName: string;
  year?: number;
  completedDate?: string;
  status?: string;
  vertical?: string;
  authoringTool?: string;
  sme?: string;
  legalReviewer?: string;
  courseLength?: string;
  interactionCount?: number;
  [key: string]: any;
}

export interface TimeSpentRecord {
  courseName: string;
  category?: string;
  time?: number;
  hours?: number;
  user?: string;
  [key: string]: any;
}

export interface UnifiedCourseData {
  courseName: string;
  normalizedCourseName: string;
  reportingYear: number; // Year from Reporting field - identifies the project instance
  totalTime: number;
  year: number; // Kept for compatibility, same as reportingYear
  status: string;
  classification: 'Legacy' | 'Modern' | 'In Progress';
  categoryBreakdown?: Map<string, number>;
  metadata: Record<string, any>;
  rawRecords: {
    legacy?: LegacyCourseRecord;
    modern?: ModernCourseRecord;
    timeSpent?: TimeSpentRecord[];
  };
}

export interface ValidationError {
  file: string;
  row?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize course name for consistent matching
 */
export function normalizeCourseName(name: string): string {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/[^\w\s-]/g, ''); // remove special characters except hyphens
}

/**
 * Parse CSV/Excel file
 */
export async function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Extract year from various date formats
 */
function extractYear(value: any): number | undefined {
  if (!value) return undefined;
  
  // If it's already a number
  if (typeof value === 'number' && value >= 2022 && value <= 2100) {
    return Math.floor(value);
  }
  
  // If it's a string
  const str = String(value);
  
  // Try to match YYYY pattern
  const yearMatch = str.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1]);
  }
  
  // Try to parse as date
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.getFullYear();
  }
  
  return undefined;
}

/**
 * Extract numeric value from various formats
 */
function extractNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value).trim();
  
  // Check if it's Excel TIME format (e.g., "1:45:00 AM" or "1:45:00 PM")
  // Excel stores durations as times, so we strip AM/PM and treat as duration
  const excelTimeMatch = str.match(/^(\d+):(\d+)(?::(\d+))?\s*(?:AM|PM)?$/i);
  if (excelTimeMatch) {
    const hours = parseInt(excelTimeMatch[1]);
    const minutes = parseInt(excelTimeMatch[2]);
    const seconds = excelTimeMatch[3] ? parseInt(excelTimeMatch[3]) : 0;
    
    // If it has AM/PM but hour is > 12, it's likely a duration, not a time
    // Also, if hour is 0-23 without AM/PM, treat as duration
    const isProbablyDuration = hours > 12 || !str.match(/AM|PM/i);
    
    return hours + (minutes / 60) + (seconds / 3600);
  }
  
  // Check if it's in hh:mm:ss format
  const hhmmssMatch = str.match(/^(\d+):(\d+):(\d+)$/);
  if (hhmmssMatch) {
    const hours = parseInt(hhmmssMatch[1]);
    const minutes = parseInt(hhmmssMatch[2]);
    const seconds = parseInt(hhmmssMatch[3]);
    return hours + (minutes / 60) + (seconds / 3600);
  }
  
  // Check if it's in hh:mm format
  const hhmmMatch = str.match(/^(\d+):(\d+)$/);
  if (hhmmMatch) {
    const hours = parseInt(hhmmMatch[1]);
    const minutes = parseInt(hhmmMatch[2]);
    return hours + (minutes / 60);
  }
  
  // Otherwise try to parse as regular number
  const cleaned = str.replace(/[^\\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert duration value to display format (h:mm)
 */
export function formatDuration(hours: number | string): string {
  if (typeof hours === 'string') {
    // If it already looks like a duration format, return as-is
    if (hours.match(/^\d+:\d{2}$/)) {
      return hours;
    }
    
    // Try to extract numeric value
    const numericValue = extractNumber(hours);
    if (numericValue === 0) return hours; // Return original if can't parse
    hours = numericValue;
  }
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

/**
 * Helper to find metadata field with LCT prefix and (L) or (M) suffix
 */
export function findMetadataField(metadata: Record<string, any>, fieldName: string): any {
  // Try exact match first
  if (metadata[fieldName] !== undefined) {
    return metadata[fieldName];
  }
  
  // Try case-insensitive partial match
  const lowerFieldName = fieldName.toLowerCase();
  const key = Object.keys(metadata).find(k => {
    const lower = k.toLowerCase();
    return lower.includes(lowerFieldName);
  });
  
  return key ? metadata[key] : undefined;
}

/**
 * Get metadata value with LCT field support
 */
export function getMetadataValue(metadata: Record<string, any>, searchKeys: string[]): string {
  for (const searchKey of searchKeys) {
    const value = findMetadataField(metadata, searchKey);
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return 'N/A';
}

// ============================================================================
// NORMALIZATION LAYER
// ============================================================================

export function normalizeLegacyData(rawData: any[]): {
  data: LegacyCourseRecord[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const data: LegacyCourseRecord[] = [];
  
  // Debug: Log column headers
  if (rawData.length > 0) {
    console.log('Legacy Course Data - Columns:', Object.keys(rawData[0]));
  }
  
  rawData.forEach((row, index) => {
    const record: LegacyCourseRecord = {
      courseName: '',
      totalTime: 0,
    };
    
    // Find course name field - be more flexible
    const courseNameKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return (
        lower === 'course name' ||
        lower === 'coursename' ||
        lower === 'name' ||
        lower === 'course' ||
        lower === 'title' ||
        lower.includes('course') && lower.includes('name')
      );
    });
    
    if (courseNameKey) {
      const value = row[courseNameKey];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        record.courseName = String(value).trim();
      }
    }
    
    if (!record.courseName) {
      errors.push({
        file: 'Legacy Course Data',
        row: index + 2,
        field: 'Course Name',
        message: 'Missing or empty course name',
        severity: 'error'
      });
      return;
    }
    
    // Find time field - look for exact "Time spent" or variations
    const timeKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return (
        lower === 'time spent' ||
        lower === 'timespent' ||
        lower === 'time' ||
        lower === 'hours' ||
        lower === 'total time' ||
        lower === 'totaltime' ||
        lower.includes('time') && lower.includes('spent') ||
        lower.includes('total') && (lower.includes('time') || lower.includes('hour'))
      );
    });
    
    if (timeKey) {
      const value = row[timeKey];
      if (value !== null && value !== undefined && value !== '') {
        record.totalTime = extractNumber(value);
      }
    }
    
    // Only warn if time is zero or missing - don't prevent processing
    if (record.totalTime === 0) {
      errors.push({
        file: 'Legacy Course Data',
        row: index + 2,
        field: 'Total Time',
        message: `Course "${record.courseName}" has zero or missing total time`,
        severity: 'warning'
      });
    }
    
    // Find year - check multiple possible fields
    let yearValue: number | undefined;
    
    // First try explicit year field
    const yearKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return lower === 'year' || lower.includes('year');
    });
    
    if (yearKey) {
      yearValue = extractYear(row[yearKey]);
    }
    
    // If no year found, try date fields
    if (!yearValue) {
      const dateKeys = Object.keys(row).filter(key => {
        const lower = key.toLowerCase().trim();
        return lower.includes('date') || lower.includes('completed') || lower.includes('reporting');
      });
      
      for (const dateKey of dateKeys) {
        yearValue = extractYear(row[dateKey]);
        if (yearValue) break;
      }
    }
    
    if (yearValue) {
      record.year = yearValue;
    }
    
    // Store all other metadata
    Object.keys(row).forEach(key => {
      record[key] = row[key];
    });
    
    data.push(record);
  });
  
  console.log('Legacy Course Data - Parsed records:', data.length);
  console.log('Legacy Course Data - Sample:', data.slice(0, 2));
  
  return { data, errors };
}

export function normalizeModernData(rawData: any[]): {
  data: ModernCourseRecord[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const data: ModernCourseRecord[] = [];
  
  // Debug: Log column headers
  if (rawData.length > 0) {
    console.log('Modern Course Data - Columns:', Object.keys(rawData[0]));
  }
  
  rawData.forEach((row, index) => {
    const record: ModernCourseRecord = {
      courseName: '',
    };
    
    // Find course name field - be more flexible
    const courseNameKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return (
        lower === 'course name' ||
        lower === 'coursename' ||
        lower === 'name' ||
        lower === 'course' ||
        lower === 'title' ||
        lower.includes('course') && lower.includes('name')
      );
    });
    
    if (courseNameKey) {
      const value = row[courseNameKey];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        record.courseName = String(value).trim();
      }
    }
    
    if (!record.courseName) {
      errors.push({
        file: 'Modern Course Data',
        row: index + 2,
        field: 'Course Name',
        message: 'Missing or empty course name',
        severity: 'error'
      });
      return;
    }
    
    // Find time field - Modern courses also have "Time spent" column that's authoritative
    const timeKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return (
        lower === 'time spent' ||
        lower === 'timespent' ||
        lower === 'time' ||
        lower === 'hours' ||
        lower === 'total time' ||
        lower === 'totaltime' ||
        lower.includes('time') && lower.includes('spent') ||
        lower.includes('total') && (lower.includes('time') || lower.includes('hour'))
      );
    });
    
    if (timeKey) {
      const value = row[timeKey];
      if (value !== null && value !== undefined && value !== '') {
        record['totalTime'] = extractNumber(value);
      }
    }
    
    // Find year - check multiple possible fields
    let yearValue: number | undefined;
    
    // First try explicit year field
    const yearKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return lower === 'year' || lower.includes('year');
    });
    
    if (yearKey) {
      yearValue = extractYear(row[yearKey]);
    }
    
    // If no year found, try date fields
    if (!yearValue) {
      const dateKeys = Object.keys(row).filter(key => {
        const lower = key.toLowerCase().trim();
        return lower.includes('date') || lower.includes('completed') || lower.includes('reporting');
      });
      
      for (const dateKey of dateKeys) {
        yearValue = extractYear(row[dateKey]);
        if (yearValue) break;
      }
    }
    
    if (yearValue) {
      record.year = yearValue;
    }
    
    // Store all other metadata
    Object.keys(row).forEach(key => {
      record[key] = row[key];
    });
    
    data.push(record);
  });
  
  console.log('Modern Course Data - Parsed records:', data.length);
  console.log('Modern Course Data - Sample:', data.slice(0, 2));
  
  return { data, errors };
}

export function normalizeTimeSpentData(rawData: any[]): {
  data: TimeSpentRecord[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const data: TimeSpentRecord[] = [];
  
  // Debug: Log first row to help diagnose issues
  if (rawData.length > 0) {
    console.log('Time Spent Data - First row columns:', Object.keys(rawData[0]));
  }
  
  rawData.forEach((row, index) => {
    const record: TimeSpentRecord = {
      courseName: '',
    };
    
    // Find course name field - be very flexible
    const courseNameKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return (
        lower.includes('course') ||
        lower.includes('name') ||
        lower.includes('title') ||
        lower === 'name' ||
        lower === 'course' ||
        lower === 'title'
      );
    });
    
    if (courseNameKey) {
      const value = row[courseNameKey];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        record.courseName = String(value).trim();
      }
    }
    
    // If still no course name, skip with error
    if (!record.courseName) {
      // Only report first 5 errors to avoid spam
      if (errors.filter(e => e.field === 'Course Name').length < 5) {
        errors.push({
          file: 'Time Spent Category Data',
          row: index + 2,
          field: 'Course Name',
          message: `Missing or empty course name. Available columns: ${Object.keys(row).join(', ')}`,
          severity: 'warning'
        });
      }
      return;
    }
    
    // Find category
    const categoryKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return lower.includes('category') || lower.includes('type');
    });
    
    if (categoryKey) {
      const value = row[categoryKey];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        record.category = String(value).trim();
      }
    }
    
    // Find time/hours
    const timeKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return lower.includes('time') || lower.includes('hour');
    });
    
    if (timeKey) {
      const value = row[timeKey];
      if (value !== null && value !== undefined && value !== '') {
        const timeValue = extractNumber(value);
        record.time = timeValue;
        record.hours = timeValue;
      }
    }
    
    // Find user
    const userKey = Object.keys(row).find(key => {
      const lower = key.toLowerCase().trim();
      return lower.includes('user') || lower.includes('member') || lower.includes('employee');
    });
    
    if (userKey) {
      const value = row[userKey];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        record.user = String(value).trim();
      }
    }
    
    // Store all other metadata
    Object.keys(row).forEach(key => {
      if (key !== courseNameKey && key !== categoryKey && key !== timeKey && key !== userKey) {
        record[key] = row[key];
      }
    });
    
    data.push(record);
  });
  
  return { data, errors };
}

// ============================================================================
// MERGE & JOIN ENGINE
// ============================================================================

/**
 * Extract year from Reporting field specifically
 */
function extractReportingYear(record: any, fileType: 'Legacy' | 'Modern'): number | undefined {
  // Look for the Reporting field with correct suffix
  const reportingKey = Object.keys(record).find(key => {
    const lower = key.toLowerCase().trim();
    if (fileType === 'Legacy') {
      return lower.includes('reporting') && (lower.includes('(l)') || !lower.includes('(m)'));
    } else {
      return lower.includes('reporting') && (lower.includes('(m)') || !lower.includes('(l)'));
    }
  });
  
  if (reportingKey && record[reportingKey]) {
    return extractYear(record[reportingKey]);
  }
  
  // Fallback: look for any reporting field
  const anyReportingKey = Object.keys(record).find(key => 
    key.toLowerCase().includes('reporting')
  );
  
  if (anyReportingKey && record[anyReportingKey]) {
    return extractYear(record[anyReportingKey]);
  }
  
  return undefined;
}

/**
 * Create a unique key for each course instance
 * Key = normalized course name + reporting year
 */
function createCourseKey(courseName: string, reportingYear: number): string {
  return `${normalizeCourseName(courseName)}__${reportingYear}`;
}

export function mergeAndClassifyData(
  legacyData: LegacyCourseRecord[],
  modernData: ModernCourseRecord[],
  timeSpentData: TimeSpentRecord[]
): {
  unified: UnifiedCourseData[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const courseMap = new Map<string, UnifiedCourseData>();
  
  console.log('=== Starting merge process ===');
  console.log('Legacy records:', legacyData.length);
  console.log('Modern records:', modernData.length);
  console.log('Time spent records:', timeSpentData.length);
  
  // Step 1: Process Legacy courses (2022-2025)
  legacyData.forEach((legacy, index) => {
    const reportingYear = extractReportingYear(legacy, 'Legacy');
    
    if (!reportingYear) {
      errors.push({
        file: 'Legacy Course Data',
        row: index + 2,
        field: 'Reporting',
        message: `Course \"${legacy.courseName}\" missing Reporting date/year`,
        severity: 'warning'
      });
    }
    
    const year = reportingYear || legacy.year || 2024;
    const courseKey = createCourseKey(legacy.courseName, year);
    
    // Get the actual Status field from metadata
    const cleanedMetadata = cleanMetadata({ ...legacy });
    const status = cleanedMetadata['Status'] || cleanedMetadata['status'] || 'Completed';
    
    const unified: UnifiedCourseData = {
      courseName: legacy.courseName,
      normalizedCourseName: normalizeCourseName(legacy.courseName),
      reportingYear: year,
      totalTime: legacy.totalTime, // Authoritative from legacy file
      year: year,
      status: status,
      classification: 'Legacy',
      metadata: cleanedMetadata,
      rawRecords: { legacy }
    };
    
    courseMap.set(courseKey, unified);
  });
  
  console.log('After Legacy processing, courseMap size:', courseMap.size);
  
  // Step 2: Process Modern courses (2026+)
  modernData.forEach((modern, index) => {
    const reportingYear = extractReportingYear(modern, 'Modern');
    
    if (!reportingYear) {
      errors.push({
        file: 'Modern Course Data',
        row: index + 2,
        field: 'Reporting',
        message: `Course \"${modern.courseName}\" missing Reporting date/year`,
        severity: 'warning'
      });
    }
    
    const year = reportingYear || modern.year || 2026;
    const courseKey = createCourseKey(modern.courseName, year);
    
    if (courseMap.has(courseKey)) {
      errors.push({
        file: 'Modern Course Data',
        field: 'Course Name',
        message: `Duplicate course instance found: \"${modern.courseName}\" for year ${year}`,
        severity: 'warning'
      });
      return;
    }
    
    // Modern courses have authoritative "Time spent" in their file
    const modernTime = (modern as any).totalTime || 0;
    
    // Get the actual Status field from metadata
    const cleanedMetadata = cleanMetadata({ ...modern });
    const status = cleanedMetadata['Status'] || cleanedMetadata['status'] || 'Completed';
    
    const unified: UnifiedCourseData = {
      courseName: modern.courseName,
      normalizedCourseName: normalizeCourseName(modern.courseName),
      reportingYear: year,
      totalTime: modernTime, // Use authoritative time from Modern file
      year: year,
      status: status,
      classification: 'Modern',
      metadata: cleanedMetadata,
      rawRecords: { modern }
    };
    
    courseMap.set(courseKey, unified);
  });
  
  console.log('After Modern processing, courseMap size:', courseMap.size);
  
  // Step 3: Aggregate time spent data by course name only (not by year yet)
  // We need to match time entries to courses, but time entries don't have years
  const timeSpentByCourse = new Map<string, TimeSpentRecord[]>();
  
  timeSpentData.forEach(timeEntry => {
    const normalized = normalizeCourseName(timeEntry.courseName);
    
    if (!timeSpentByCourse.has(normalized)) {
      timeSpentByCourse.set(normalized, []);
    }
    timeSpentByCourse.get(normalized)!.push(timeEntry);
  });
  
  console.log('Unique courses in time spent data:', timeSpentByCourse.size);
  
  // Step 4: Attach time spent category data to existing courses
  // For courses that exist in Legacy/Modern, add category breakdowns
  courseMap.forEach((course, key) => {
    const normalized = course.normalizedCourseName;
    
    if (timeSpentByCourse.has(normalized)) {
      const entries = timeSpentByCourse.get(normalized)!;
      
      // Build category breakdown from time entries
      const categoryMap = new Map<string, number>();
      entries.forEach(entry => {
        const category = entry.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (entry.time || entry.hours || 0));
      });
      
      course.categoryBreakdown = categoryMap;
      course.rawRecords.timeSpent = entries;
      
      // Mark that we've processed this course
      timeSpentByCourse.delete(normalized);
    }
  });
  
  // Step 5: Any remaining time spent entries are for In Progress courses
  timeSpentByCourse.forEach((entries, normalizedName) => {
    const totalTime = entries.reduce((sum, entry) => sum + (entry.time || entry.hours || 0), 0);
    
    // Build category breakdown
    const categoryMap = new Map<string, number>();
    entries.forEach(entry => {
      const category = entry.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + (entry.time || entry.hours || 0));
    });
    
    const originalName = entries[0]?.courseName || '';
    const currentYear = new Date().getFullYear();
    const courseKey = createCourseKey(originalName, currentYear);
    
    const unified: UnifiedCourseData = {
      courseName: originalName,
      normalizedCourseName: normalizedName,
      reportingYear: currentYear,
      totalTime: totalTime,
      year: currentYear,
      status: 'In Progress',
      classification: 'In Progress',
      categoryBreakdown: categoryMap,
      metadata: {},
      rawRecords: { timeSpent: entries }
    };
    
    courseMap.set(courseKey, unified);
  });
  
  console.log('Final courseMap size:', courseMap.size);
  
  return {
    unified: Array.from(courseMap.values()),
    errors
  };
}

// ============================================================================
// AGGREGATION ENGINE
// ============================================================================

export interface AggregatedAnalytics {
  summary: {
    totalCourses: number;
    totalTimeSpent: number;
    completedCourses: number;
    inProgressCourses: number;
    averageTimePerCourse: number;
    legacyCourses: number;
    modernCourses: number;
  };
  
  byYear: Array<{
    year: number;
    count: number;
    totalTime: number;
    avgTime: number;
  }>;
  
  byStatus: Array<{
    status: string;
    count: number;
    totalTime: number;
  }>;
  
  byCategory: Array<{
    category: string;
    totalTime: number;
    courseCount: number;
    avgTimePerCourse: number;
  }>;
  
  topCourses: Array<{
    courseName: string;
    totalTime: number;
    year: number;
    status: string;
  }>;
  
  timeByYearAndStatus: Array<{
    year: number;
    legacy: number;
    modern: number;
    inProgress: number;
  }>;
}

export function computeAnalytics(courses: UnifiedCourseData[]): AggregatedAnalytics {
  // Summary statistics
  const totalCourses = courses.length;
  const totalTimeSpent = courses.reduce((sum, c) => sum + c.totalTime, 0);
  const completedCourses = courses.filter(c => c.classification !== 'In Progress').length;
  const inProgressCourses = courses.filter(c => c.classification === 'In Progress').length;
  const legacyCourses = courses.filter(c => c.classification === 'Legacy').length;
  const modernCourses = courses.filter(c => c.classification === 'Modern').length;
  const averageTimePerCourse = totalCourses > 0 ? totalTimeSpent / totalCourses : 0;
  
  // By year
  const yearMap = new Map<number, { count: number; totalTime: number }>();
  courses.forEach(course => {
    const year = course.year || new Date().getFullYear();
    const existing = yearMap.get(year) || { count: 0, totalTime: 0 };
    existing.count++;
    existing.totalTime += course.totalTime;
    yearMap.set(year, existing);
  });
  
  const byYear = Array.from(yearMap.entries())
    .map(([year, data]) => ({
      year,
      count: data.count,
      totalTime: data.totalTime,
      avgTime: data.totalTime / data.count
    }))
    .sort((a, b) => a.year - b.year);
  
  // By status
  const statusMap = new Map<string, { count: number; totalTime: number }>();
  courses.forEach(course => {
    const status = course.status;
    const existing = statusMap.get(status) || { count: 0, totalTime: 0 };
    existing.count++;
    existing.totalTime += course.totalTime;
    statusMap.set(status, existing);
  });
  
  const byStatus = Array.from(statusMap.entries())
    .map(([status, data]) => ({
      status,
      count: data.count,
      totalTime: data.totalTime
    }));
  
  // By category
  const categoryMap = new Map<string, { totalTime: number; courses: Set<string> }>();
  courses.forEach(course => {
    if (course.categoryBreakdown) {
      course.categoryBreakdown.forEach((time, category) => {
        const existing = categoryMap.get(category) || { totalTime: 0, courses: new Set() };
        existing.totalTime += time;
        existing.courses.add(course.normalizedCourseName);
        categoryMap.set(category, existing);
      });
    }
  });
  
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      totalTime: data.totalTime,
      courseCount: data.courses.size,
      avgTimePerCourse: data.totalTime / data.courses.size
    }))
    .sort((a, b) => b.totalTime - a.totalTime);
  
  // Top courses
  const topCourses = [...courses]
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 20)
    .map(c => ({
      courseName: c.courseName,
      totalTime: c.totalTime,
      year: c.year,
      status: c.status
    }));
  
  // Time by year and status
  const yearStatusMap = new Map<number, { legacy: number; modern: number; inProgress: number }>();
  courses.forEach(course => {
    const year = course.year || new Date().getFullYear();
    const existing = yearStatusMap.get(year) || { legacy: 0, modern: 0, inProgress: 0 };
    
    if (course.classification === 'Legacy') {
      existing.legacy += course.totalTime;
    } else if (course.classification === 'Modern') {
      existing.modern += course.totalTime;
    } else {
      existing.inProgress += course.totalTime;
    }
    
    yearStatusMap.set(year, existing);
  });
  
  const timeByYearAndStatus = Array.from(yearStatusMap.entries())
    .map(([year, data]) => ({ year, ...data }))
    .sort((a, b) => a.year - b.year);
  
  return {
    summary: {
      totalCourses,
      totalTimeSpent,
      completedCourses,
      inProgressCourses,
      averageTimePerCourse,
      legacyCourses,
      modernCourses
    },
    byYear,
    byStatus,
    byCategory,
    topCourses,
    timeByYearAndStatus
  };
}

// ============================================================================
// METADATA EXTRACTION UTILITIES
// ============================================================================

/**
 * Extract unique values for metadata fields
 */
export function extractMetadataOptions(courses: UnifiedCourseData[]): {
  verticals: string[];
  authoringTools: string[];
  smes: string[];
  legalReviewers: string[];
  courseLengths: string[];
  statuses: string[];
  idAssigned: string[];
  courseTypes: string[];
  courseStyles: string[];
  allMetadataFields: Array<{ key: string; values: string[]; missingCount: number }>;
} {
  const verticalsSet = new Set<string>();
  const authoringToolsSet = new Set<string>();
  const smesSet = new Set<string>();
  const legalReviewersSet = new Set<string>();
  const courseLengthsSet = new Set<string>();
  const statusesSet = new Set<string>();
  const idAssignedSet = new Set<string>();
  const courseTypesSet = new Set<string>();
  const courseStylesSet = new Set<string>();
  
  // Track all unique metadata keys and their values
  const allFieldsMap = new Map<string, { values: Set<string>; missingCount: number }>();
  
  courses.forEach(course => {
    const metadata = course.metadata;
    
    // Track all metadata fields
    Object.keys(metadata).forEach(key => {
      if (!allFieldsMap.has(key)) {
        allFieldsMap.set(key, { values: new Set(), missingCount: 0 });
      }
      const field = allFieldsMap.get(key)!;
      const value = metadata[key];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        field.values.add(String(value).trim());
      } else {
        field.missingCount++;
      }
    });
    
    // Extract vertical
    const verticalKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('vertical')
    );
    if (verticalKey && metadata[verticalKey]) {
      verticalsSet.add(String(metadata[verticalKey]).trim());
    }
    
    // Extract authoring tool
    const authoringToolKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('authoring') && k.toLowerCase().includes('tool')
    );
    if (authoringToolKey && metadata[authoringToolKey]) {
      authoringToolsSet.add(String(metadata[authoringToolKey]).trim());
    }
    
    // Extract SME
    const smeKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('sme')
    );
    if (smeKey && metadata[smeKey]) {
      smesSet.add(String(metadata[smeKey]).trim());
    }
    
    // Extract Legal Reviewer
    const legalReviewerKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('legal') && k.toLowerCase().includes('reviewer')
    );
    if (legalReviewerKey && metadata[legalReviewerKey]) {
      legalReviewersSet.add(String(metadata[legalReviewerKey]).trim());
    }
    
    // Extract Course Length
    const courseLengthKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('course') && k.toLowerCase().includes('length')
    );
    if (courseLengthKey && metadata[courseLengthKey]) {
      courseLengthsSet.add(String(metadata[courseLengthKey]).trim());
    }
    
    // Extract Status
    const statusKey = Object.keys(metadata).find(k => 
      k.toLowerCase() === 'status'
    );
    if (statusKey && metadata[statusKey]) {
      statusesSet.add(String(metadata[statusKey]).trim());
    }
    
    // Extract ID Assigned
    const idKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('id') && k.toLowerCase().includes('assigned')
    );
    if (idKey && metadata[idKey]) {
      idAssignedSet.add(String(metadata[idKey]).trim());
    }
    
    // Extract Course Type
    const typeKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('course') && k.toLowerCase().includes('type')
    );
    if (typeKey && metadata[typeKey]) {
      courseTypesSet.add(String(metadata[typeKey]).trim());
    }
    
    // Extract Course Style
    const styleKey = Object.keys(metadata).find(k => 
      k.toLowerCase().includes('course') && k.toLowerCase().includes('style')
    );
    if (styleKey && metadata[styleKey]) {
      courseStylesSet.add(String(metadata[styleKey]).trim());
    }
  });
  
  // Convert all fields map to array
  const allMetadataFields = Array.from(allFieldsMap.entries())
    .map(([key, data]) => ({
      key,
      values: Array.from(data.values).sort(),
      missingCount: data.missingCount
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
  
  return {
    verticals: Array.from(verticalsSet).filter(v => v).sort(),
    authoringTools: Array.from(authoringToolsSet).filter(v => v).sort(),
    smes: Array.from(smesSet).filter(v => v).sort(),
    legalReviewers: Array.from(legalReviewersSet).filter(v => v).sort(),
    courseLengths: Array.from(courseLengthsSet).filter(v => v).sort(),
    statuses: Array.from(statusesSet).filter(v => v).sort(),
    idAssigned: Array.from(idAssignedSet).filter(v => v).sort(),
    courseTypes: Array.from(courseTypesSet).filter(v => v).sort(),
    courseStyles: Array.from(courseStylesSet).filter(v => v).sort(),
    allMetadataFields
  };
}

/**
 * Clean metadata field names by removing [LCT] prefix and (M)/(L) suffix
 */
function cleanFieldName(fieldName: string): string {
  return fieldName
    .replace(/^\[LCT\]\s*/i, '') // Remove [LCT] prefix
    .replace(/\s*\([ML]\)$/i, '') // Remove (M) or (L) suffix
    .trim();
}

/**
 * Clean metadata object keys
 */
function cleanMetadata(metadata: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const cleanKey = cleanFieldName(key);
    cleaned[cleanKey] = value;
  }
  return cleaned;
}