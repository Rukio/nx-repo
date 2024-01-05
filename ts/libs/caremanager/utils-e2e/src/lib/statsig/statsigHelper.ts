import { Statsig } from '@*company-data-covered*/cypress-shared';
import { StatsigEnvironment, StatsigOptions } from 'statsig-js';

type StatsigTier = StatsigEnvironment['tier'];

const statsigClientKey = Cypress.env('STATSIG_CLIENT_KEY');
const statsigUser = null;
const statsigTier: StatsigTier =
  (Cypress.env('STATSIG_ENV') as StatsigTier) ?? 'development';
const statsigOptions: StatsigOptions = {
  localMode: true,
  environment: {
    tier: statsigTier,
  },
};

const experimentsList = {};
const featureGatesList = {
  maintenanceMode: 'caremanager_maintenance_mode',
  visitsV1: 'caremanager_visits_v1',
};

export const statsigHelper = new Statsig({
  options: {
    user: statsigUser,
    clientKey: statsigClientKey,
    ...statsigOptions,
  },
  featureGatesList,
  experimentsList,
});

statsigHelper.initialize();
