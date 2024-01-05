import { environment } from '../environments/environment';

export const statsigOptions = {
  environment: {
    tier: environment.statsigTier,
  },
};

export const CLINICAL_KPI_ROUTES = {
  PERFORMANCE_HUB: '/',
  LEADER_HUB: '/leads',
  INDIVIDUAL_PERFORMANCE_HUB: '/leads/providers/:id',
};

export type LeadsProvidersPathParams = 'id';
