import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GraduationCap, Clock, CheckCircle, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import type { AggregatedAnalytics } from '../utils/csvProcessor';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

interface AnalyticsDashboardProps {
  analytics: AggregatedAnalytics;
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const { summary, byYear, byStatus, byCategory, topCourses, timeByYearAndStatus } = analytics;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl font-bold">{summary.totalCourses}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-2xl font-bold">{summary.totalTimeSpent.toFixed(0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold">{summary.completedCourses}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-2xl font-bold">{summary.inProgressCourses}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Hours/Course</p>
              <p className="text-2xl font-bold">{summary.averageTimePerCourse.toFixed(1)}</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-50">
              <TrendingUp className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Legacy/Modern</p>
              <p className="text-xl font-bold">{summary.legacyCourses}/{summary.modernCourses}</p>
            </div>
            <div className="p-3 rounded-lg bg-pink-50">
              <Activity className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yearly">By Year</TabsTrigger>
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="top">Top Courses</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Time Spent by Year and Classification</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={timeByYearAndStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="legacy" stackId="a" fill="#3b82f6" name="Legacy (2022-2025)" />
                <Bar dataKey="modern" stackId="a" fill="#8b5cf6" name="Modern (2026+)" />
                <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Courses by Year</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={byYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Course Count" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Yearly Tab */}
        <TabsContent value="yearly" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Year-over-Year Analysis</h3>
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Year</th>
                    <th className="text-right py-2 px-4">Course Count</th>
                    <th className="text-right py-2 px-4">Total Hours</th>
                    <th className="text-right py-2 px-4">Avg Hours/Course</th>
                  </tr>
                </thead>
                <tbody>
                  {byYear.map((year) => (
                    <tr key={year.year} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{year.year}</td>
                      <td className="py-2 px-4 text-right">{year.count}</td>
                      <td className="py-2 px-4 text-right">{year.totalTime.toFixed(1)}</td>
                      <td className="py-2 px-4 text-right">{year.avgTime.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={byYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Course Count" />
                <Bar yAxisId="right" dataKey="totalTime" fill="#10b981" name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Courses by Status</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={byStatus} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="status" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Course Count" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Time by Status</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ status, totalTime }) => `${status}: ${totalTime.toFixed(0)}h`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="totalTime"
                  >
                    {byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Category Tab */}
        <TabsContent value="category" className="mt-6">
          {byCategory.length > 0 ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Time by Category</h3>
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Category</th>
                      <th className="text-right py-2 px-4">Total Hours</th>
                      <th className="text-right py-2 px-4">Course Count</th>
                      <th className="text-right py-2 px-4">Avg Hours/Course</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCategory.map((cat, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">{cat.category}</td>
                        <td className="py-2 px-4 text-right">{cat.totalTime.toFixed(1)}</td>
                        <td className="py-2 px-4 text-right">{cat.courseCount}</td>
                        <td className="py-2 px-4 text-right">{cat.avgTimePerCourse.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={byCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalTime" fill="#8b5cf6" name="Total Hours" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card className="p-6">
              <p className="text-center text-gray-500">No category data available</p>
            </Card>
          )}
        </TabsContent>

        {/* Top Courses Tab */}
        <TabsContent value="top" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top 20 Courses by Time Spent</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Rank</th>
                    <th className="text-left py-2 px-4">Course Name</th>
                    <th className="text-right py-2 px-4">Total Hours</th>
                    <th className="text-center py-2 px-4">Year</th>
                    <th className="text-center py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topCourses.map((course, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 text-gray-500">#{index + 1}</td>
                      <td className="py-2 px-4 font-medium">{course.courseName}</td>
                      <td className="py-2 px-4 text-right font-semibold">{course.totalTime.toFixed(1)}</td>
                      <td className="py-2 px-4 text-center">{course.year}</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          course.status.includes('Legacy') ? 'bg-blue-100 text-blue-800' :
                          course.status.includes('Modern') ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={topCourses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="courseName" type="category" width={200} />
                <Tooltip />
                <Bar dataKey="totalTime" fill="#10b981" name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
