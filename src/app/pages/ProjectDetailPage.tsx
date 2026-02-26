import { useOutletContext, useParams, Navigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, Clock, Calendar, User, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { UnifiedCourseData } from '../utils/csvProcessor';
import { getMetadataValue, formatDuration } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function ProjectDetailPage() {
  const { courseName, year } = useParams<{ courseName: string; year: string }>();
  const { unifiedData } = useOutletContext<DashboardContext>();
  
  const course = unifiedData.find(c => 
    c.courseName === decodeURIComponent(courseName || '') && 
    c.reportingYear === parseInt(year || '0')
  );
  
  if (!course) {
    return <Navigate to="/projects" replace />;
  }
  
  // Prepare category chart data
  const categoryData = course.categoryBreakdown
    ? Array.from(course.categoryBreakdown.entries()).map(([category, time]) => ({
        name: category,
        value: parseFloat(time.toFixed(2)),
        hours: time.toFixed(2)
      }))
    : [];
  
  // Get time entries
  const timeEntries = course.rawRecords.timeSpent || [];
  
  // Get metadata
  const metadata = course.metadata;
  
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <Link to="/projects">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="size-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <h2 className="text-3xl font-semibold mb-2">{course.courseName}</h2>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{course.classification}</Badge>
              <Badge>{course.status}</Badge>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="size-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Time</p>
                    <p className="text-2xl font-semibold">{course.totalTime.toFixed(1)} hrs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="size-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="text-2xl font-semibold">{course.year}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <BarChart3 className="size-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Entries</p>
                    <p className="text-2xl font-semibold">{timeEntries.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Course Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vertical</p>
                  <p className="text-base">{getMetadataValue(metadata, ['vertical'])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Authoring Tool</p>
                  <p className="text-base">{getMetadataValue(metadata, ['authoring tool'])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">SME</p>
                  <p className="text-base">{getMetadataValue(metadata, ['sme'])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Legal Reviewer</p>
                  <p className="text-base">{getMetadataValue(metadata, ['legal reviewer'])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Course Length</p>
                  <p className="text-base">{formatDuration(getMetadataValue(metadata, ['course length']))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Interaction Count</p>
                  <p className="text-base">{getMetadataValue(metadata, ['interaction count'])}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Category Breakdown Chart */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Time by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.hours}h`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} hours`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          
          {/* Time Entries Table */}
          {timeEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Time Entries ({timeEntries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Time (hours)</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="size-4 text-gray-400" />
                              {entry.user || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.category || 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {(entry.time || entry.hours || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {entry['Date'] || entry['date'] || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}