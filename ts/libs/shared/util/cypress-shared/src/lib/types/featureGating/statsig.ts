import { StatsigOptions, StatsigUser } from 'statsig-js';

export declare namespace StatsigOverrides {
  type ExperimentKey = string;
  type ExperimentOverrideParamMap = Record<
    ExperimentKey,
    Record<string, unknown>
  >;

  type FeatureGateKey = string;
  type FeatureGateOverrideParamMap = Record<FeatureGateKey, boolean>;
}

export declare namespace StatsigHelper {
  type ExperimentKey = StatsigOverrides.ExperimentKey;
  type FeatureGateKey = StatsigOverrides.FeatureGateKey;

  type ExperimentList = Record<ExperimentKey, string>;
  type FeatureGateList = Record<FeatureGateKey, string>;

  type Options = {
    clientKey: string;
    user: StatsigUser | null;
  } & StatsigOptions;

  type Initialize<E extends ExperimentList, F extends FeatureGateList> = {
    options: Options;
    experimentsList: E;
    featureGatesList: F;
  };

  type FeatureGateOverrideParamMap =
    StatsigOverrides.FeatureGateOverrideParamMap;
  type ExperimentOverrideParamMap = StatsigOverrides.ExperimentOverrideParamMap;
}
