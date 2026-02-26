import { AnalyticsDashboard } from './AnalyticsDashboard';
import type { AggregatedAnalytics } from '../utils/csvProcessor';

interface AnalyticsOverviewProps {
  analytics: AggregatedAnalytics;
}

export function AnalyticsOverview({ analytics }: AnalyticsOverviewProps) {
  return <AnalyticsDashboard analytics={analytics} />;
}
