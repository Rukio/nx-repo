import statsig from 'statsig-js';

export const checkFeatureGate = (gateName: string): boolean =>
  statsig.checkGate(gateName);
