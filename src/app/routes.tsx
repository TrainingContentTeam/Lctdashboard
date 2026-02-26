import { createHashRouter } from 'react-router';
import { AppRoot } from './App';
import DashboardPage from './pages/DashboardPage';
import AllProjectsPage from './pages/AllProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import DevelopmentPage from './pages/DevelopmentPage';
import SMEPage from './pages/SMEPage';
import ExternalTeamsPage from './pages/ExternalTeamsPage';

export const router = createHashRouter([
  {
    path: '/',
    Component: AppRoot,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'projects', Component: AllProjectsPage },
      { path: 'projects/:courseName/:year', Component: ProjectDetailPage },
      { path: 'course-details', Component: CourseDetailsPage },
      { path: 'development', Component: DevelopmentPage },
      { path: 'sme', Component: SMEPage },
      { path: 'external-teams', Component: ExternalTeamsPage },
    ],
  },
]);
