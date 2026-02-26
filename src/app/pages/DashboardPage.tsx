import { useOutletContext } from 'react-router';
import { FileUpload } from '../components/FileUpload';
import { SimplifiedDashboard } from '../components/SimplifiedDashboard';
import type { UnifiedCourseData, AggregatedAnalytics } from '../utils/csvProcessor';

interface DashboardContext {
  currentStep: number;
  unifiedData: UnifiedCourseData[];
  analytics: AggregatedAnalytics | null;
  handleFilesUploaded: (data: UnifiedCourseData[]) => void;
  lastUpdated: Date | null;
}

export default function DashboardPage() {
  const { currentStep, unifiedData, analytics, handleFilesUploaded, lastUpdated } = useOutletContext<DashboardContext>();
  
  if (currentStep === 1) {
    return (
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-2">Upload Course Data</h2>
            <p className="text-gray-600">Upload your CSV files to begin analysis</p>
          </div>
          <FileUpload onFilesUploaded={handleFilesUploaded} />
        </div>
      </main>
    );
  }
  
  if (currentStep === 2) {
    return (
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-2">Processing Files</h2>
            <p className="text-gray-600">Your data is being processed...</p>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-semibold mb-2">Analytics Dashboard</h2>
            <p className="text-gray-600">Overview of all course data and insights</p>
          </div>
          
          <SimplifiedDashboard courses={unifiedData} lastUpdated={lastUpdated} />
        </div>
      </div>
    </main>
  );
}