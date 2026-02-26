import { Clock, DollarSign, Briefcase, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';

interface DashboardStatsProps {
  totalHours: number;
  totalProjects: number;
  totalRevenue: number;
  averageHoursPerProject: number;
}

export function DashboardStats({
  totalHours,
  totalProjects,
  totalRevenue,
  averageHoursPerProject
}: DashboardStatsProps) {
  const stats = [
    {
      title: 'Total Hours Logged',
      value: totalHours.toFixed(1),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Projects',
      value: totalProjects,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg Hours/Project',
      value: averageHoursPerProject.toFixed(1),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
