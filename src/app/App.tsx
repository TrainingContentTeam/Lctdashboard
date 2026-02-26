import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { toast, Toaster } from 'sonner';
import {
  parseFile,
  normalizeLegacyData,
  normalizeModernData,
  normalizeTimeSpentData,
  mergeAndClassifyData,
  computeAnalytics,
  type UnifiedCourseData,
  type AggregatedAnalytics,
  type ValidationError
} from './utils/csvProcessor';
import { Sidebar } from './components/Sidebar';
import { Outlet, useNavigate } from 'react-router';

// Create a wrapper component for the router context
export function AppRoot() {
  const [currentStep, setCurrentStep] = useState(1); // 1 = upload, 2 = processing, 3 = dashboard
  const [unifiedData, setUnifiedData] = useState<UnifiedCourseData[]>([]);
  const [analytics, setAnalytics] = useState<AggregatedAnalytics | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleFilesUploaded = async (files: { legacy: File; modern: File; timeSpent: File }) => {
    setCurrentStep(2);
    setErrors([]);
    setLastUpdated(new Date()); // Track upload time

    try {
      const allErrors: ValidationError[] = [];

      // Step 1: Parse files
      toast.info('Parsing CSV files...');
      const [legacyRaw, modernRaw, timeSpentRaw] = await Promise.all([
        parseFile(files.legacy),
        parseFile(files.modern),
        parseFile(files.timeSpent)
      ]);

      // Step 2: Normalize and validate
      toast.info('Validating and normalizing data...');
      const legacyResult = normalizeLegacyData(legacyRaw);
      const modernResult = normalizeModernData(modernRaw);
      const timeSpentResult = normalizeTimeSpentData(timeSpentRaw);

      allErrors.push(...legacyResult.errors);
      allErrors.push(...modernResult.errors);
      allErrors.push(...timeSpentResult.errors);

      // Check for critical errors
      const criticalErrors = allErrors.filter(e => e.severity === 'error');
      if (criticalErrors.length > 0) {
        setErrors(allErrors);
        toast.error(`Found ${criticalErrors.length} critical error(s). Please review.`);
        setCurrentStep(1);
        return;
      }

      // Step 3: Merge and classify
      toast.info('Merging data and classifying courses...');
      const mergeResult = mergeAndClassifyData(
        legacyResult.data,
        modernResult.data,
        timeSpentResult.data
      );

      allErrors.push(...mergeResult.errors);

      // Step 4: Compute analytics
      toast.info('Computing analytics...');
      const analyticsData = computeAnalytics(mergeResult.unified);

      // Step 5: Update state
      setUnifiedData(mergeResult.unified);
      setAnalytics(analyticsData);
      setErrors(allErrors);
      setCurrentStep(3);

      // Show results
      const warningCount = allErrors.filter(e => e.severity === 'warning').length;
      if (warningCount > 0) {
        toast.warning(`Processing complete with ${warningCount} warning(s)`);
      } else {
        toast.success('Data processed successfully!');
      }

      console.log('Processed Data:', {
        unified: mergeResult.unified,
        analytics: analyticsData,
        errors: allErrors
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process files';
      toast.error(errorMessage);
      setErrors([{
        file: 'System',
        message: errorMessage,
        severity: 'error'
      }]);
      setCurrentStep(1);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Toaster position="top-right" richColors />
      <Sidebar currentStep={currentStep} hasData={unifiedData.length > 0} />
      <Outlet context={{ currentStep, unifiedData, analytics, handleFilesUploaded, lastUpdated }} />
    </div>
  );
}

function App() {
  return <RouterProvider router={router} />;
}

export default App;