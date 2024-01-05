import { logError } from '@*company-data-covered*/shared/datadog/util';
import statsig from 'statsig-js';

export interface StatsigLogEvent {
  eventName: string;
  value?: string | number | null;
  metadata?: Record<string, string> | null;
}

export const getStatsigStableId = () =>
  localStorage.STATSIG_LOCAL_STORAGE_STABLE_ID;

export const StatsigExperiments = {
  web_request_schedule_time_window_page: {
    name: 'web_request_schedule_time_window_page',
    params: {
      render_time_window_page: 'render_time_window_page',
    },
  },
};

export const getMarketNameFromHowItWorksConfig = (
  marketAbbreviation: string
) => {
  try {
    const howItWorksMarketsConfig = statsig.getConfig(
      'web_request_how_it_works_markets'
    );
    const howItWorksMarkets = howItWorksMarketsConfig.get<
      {
        abbreviation: string;
        name: string;
      }[]
    >('how_it_works_markets', []);

    const marketMatch = howItWorksMarkets.find(
      (market) =>
        market.abbreviation.toLowerCase() === marketAbbreviation.toLowerCase()
    );
    if (!marketMatch) {
      return null;
    }

    return marketMatch.name;
  } catch (e: unknown) {
    logError(
      `[Statsig] error occured while getting web_request_how_it_works_markets config: ${e}`
    );

    return null;
  }
};

export const getSymptomsFromStructuredSymptomsConfig = () => {
  try {
    const structuredSymptomsConfig = statsig.getConfig(
      'web_request_structured_symptoms'
    );
    if (!structuredSymptomsConfig) {
      return [];
    }

    return structuredSymptomsConfig.get<string[]>('structured_symptoms', []);
  } catch (e: unknown) {
    logError(
      `[Statsig] error occured while getting web_request_structured_symptoms config: ${e}`
    );

    return [];
  }
};
