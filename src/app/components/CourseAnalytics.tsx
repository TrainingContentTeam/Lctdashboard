import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/card';
import { GraduationCap, Clock, TrendingUp, BookOpen } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

interface CourseAnalyticsProps {
  analytics: {
    totalCourses: number;
    coursesPerYear: Array<{ year: number; count: number }>;
    avgTimePerCategory: Array<{
      category: string;
      totalHours: number;
      avgPerEntry: number;
      avgPerCourse: number;
      entryCount: number;
    }>;
    avgHoursPerCourse: number;
    hoursPerCourse: Array<{ course: string; hours: number }>;
    categoryDistribution: Array<{ category: string; hours: number; percentage: number }>;
    coursesByYear: Array<{
      year: number;
      courses: Array<{ courseName: string; totalHours: number }>;
      count: number;
    }>;
  };
}

export function CourseAnalytics({ analytics }: CourseAnalyticsProps) {
  return (
    <div className="space-y-6">
      {/* Key Course Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl font-bold">{analytics.totalCourses}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Hours/Course</p>
              <p className="text-2xl font-bold">{analytics.avgHoursPerCourse.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Categories</p>
              <p className="text-2xl font-bold">{analytics.avgTimePerCategory.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Years Active</p>
              <p className="text-2xl font-bold">{analytics.coursesPerYear.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Courses Per Year */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Courses Per Year</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.coursesPerYear}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Number of Courses" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Average Time Per Category */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Average Time Per Category</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Category</th>
                <th className="text-right py-2 px-4">Total Hours</th>
                <th className="text-right py-2 px-4">Avg per Entry</th>
                <th className="text-right py-2 px-4">Avg per Course</th>
                <th className="text-right py-2 px-4">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {analytics.avgTimePerCategory.map((cat, index) => {
                const distribution = analytics.categoryDistribution.find(d => d.category === cat.category);
                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{cat.category}</td>
                    <td className="py-2 px-4 text-right">{cat.totalHours.toFixed(1)}</td>
                    <td className="py-2 px-4 text-right">{cat.avgPerEntry.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">{cat.avgPerCourse.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">{distribution?.percentage.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.avgTimePerCategory} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="category" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgPerCourse" fill="#8b5cf6" name="Avg Hours per Course" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Time Distribution by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={analytics.categoryDistribution}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
              outerRadius={140}
              fill="#8884d8"
              dataKey="hours"
            >
              {analytics.categoryDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Courses by Hours */}
      {analytics.hoursPerCourse.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Courses by Total Hours</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.hoursPerCourse} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="course" type="category" width={200} />
              <Tooltip />
              <Bar dataKey="hours" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Courses by Year Details */}
      {analytics.coursesByYear.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Course Details by Year</h3>
          <div className="space-y-6">
            {analytics.coursesByYear.map((yearData) => (
              <div key={yearData.year} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">{yearData.year}</h4>
                  <span className="text-sm text-gray-600">{yearData.count} courses</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {yearData.courses
                    .sort((a, b) => b.totalHours - a.totalHours)
                    .map((course, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm truncate flex-1">{course.courseName}</span>
                        <span className="text-sm font-medium ml-2">{course.totalHours.toFixed(1)}h</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
