import { Navigate } from 'react-router-dom';
import { EpisodeListPage } from '@*company-data-covered*/caremanager/feature-episode-list';
import { EpisodePage } from '@*company-data-covered*/caremanager/feature-episode';
import { PatientPage } from '@*company-data-covered*/caremanager/feature-patient';
import { Settings } from '@*company-data-covered*/caremanager/feature-settings';
import { TaskTemplateForm } from '@*company-data-covered*/caremanager/feature-task-template-form';
import { VisitPage } from '@*company-data-covered*/caremanager/feature-visit';
import { ServiceRequests } from '@*company-data-covered*/caremanager/feature-service-requests';
import { VirtualAppPage } from '@*company-data-covered*/caremanager/feature-virtual-app';

const protectedRoutes = [
  {
    path: '/',
    component: () => <Navigate to="/episodes" />,
  },
  {
    path: '/episodes',
    component: EpisodeListPage,
  },
  {
    path: '/settings/task-templates/new',
    component: TaskTemplateForm,
  },
  {
    path: '/settings/task-templates/:id/edit',
    component: TaskTemplateForm,
  },
  {
    path: '/episodes/:id/*',
    component: EpisodePage,
  },
  {
    path: '/episodes/:episodeId/visits/:visitId',
    component: VisitPage,
  },
  {
    path: '/settings/*',
    component: Settings,
  },
  {
    path: '/patients/:id',
    component: PatientPage,
  },
  {
    path: '/requests/*',
    component: ServiceRequests,
  },
  {
    path: '/virtual-app/*',
    component: VirtualAppPage,
  },
];

const routes = [
  {
    path: '/503',
    component: () => <Navigate to="/episodes" />,
  },
];

const useRoutes = () => ({
  protectedRoutes,
  normalRoutes: routes,
});

export default useRoutes;
