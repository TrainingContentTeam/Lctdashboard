import { Link, useLocation } from 'react-router';
import { LayoutDashboard, FolderKanban, Upload, TrendingUp, Users, UserCheck, Building2, Table } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentStep: number;
  hasData: boolean;
}

export function Sidebar({ currentStep, hasData }: SidebarProps) {
  const location = useLocation();
  
  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      disabled: currentStep < 3,
    },
    {
      path: '/projects',
      label: 'All Projects',
      icon: FolderKanban,
      disabled: currentStep < 3,
    },
    {
      path: '/course-details',
      label: 'Course Details',
      icon: Table,
      disabled: currentStep < 3,
    },
    {
      path: '/development',
      label: 'Development',
      icon: TrendingUp,
      disabled: currentStep < 3,
    },
    {
      path: '/sme',
      label: 'SME Collaboration',
      icon: UserCheck,
      disabled: currentStep < 3,
    },
    {
      path: '/external-teams',
      label: 'External Teams',
      icon: Building2,
      disabled: currentStep < 3,
    },
  ];
  
  return (
    <aside className="w-64 border-r bg-gray-50 flex flex-col h-screen overflow-y-auto flex-shrink-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold">Course Analytics</h1>
        <p className="text-sm text-gray-600 mt-1">Data Analysis Dashboard</p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isDisabled = item.disabled || !hasData;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive && !isDisabled && 'bg-blue-100 text-blue-700',
                  !isActive && !isDisabled && 'text-gray-700 hover:bg-gray-100',
                  isDisabled && 'text-gray-400 cursor-not-allowed pointer-events-none'
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      <div className="p-4 border-t flex-shrink-0">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100'
          )}
        >
          <Upload className="size-5" />
          <span>Upload Files</span>
        </Link>
      </div>
    </aside>
  );
}