import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ChartsSectionProps {
  hoursByProject: Array<{ name: string; hours: number; budget?: number }>;
  hoursByMember: Array<{ name: string; hours: number }>;
  hoursOverTime: Array<{ date: string; hours: number }>;
  projectStatus: Array<{ name: string; value: number }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export function ChartsSection({
  hoursByProject,
  hoursByMember,
  hoursOverTime,
  projectStatus
}: ChartsSectionProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">By Project</TabsTrigger>
          <TabsTrigger value="team">By Team Member</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hours by Project</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={hoursByProject}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#3b82f6" name="Actual Hours" />
                {hoursByProject.some(p => p.budget) && (
                  <Bar dataKey="budget" fill="#10b981" name="Budgeted Hours" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hours by Team Member</h3>
            <div className="grid lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={hoursByMember} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={hoursByMember}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="hours"
                  >
                    {hoursByMember.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hours Over Time</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={hoursOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Project Status Distribution</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={projectStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
