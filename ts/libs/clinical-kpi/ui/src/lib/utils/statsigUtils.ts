import statsig from 'statsig-js';

export const getFeatureGate = (gateName: string): boolean =>
  statsig.checkGate(gateName);
