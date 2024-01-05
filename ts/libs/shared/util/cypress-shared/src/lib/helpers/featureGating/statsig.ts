import statsig, { DynamicConfig } from 'statsig-js';
import { StatsigHelper } from '../../types/featureGating/statsig';

export class Statsig<
  E extends StatsigHelper.ExperimentList,
  F extends StatsigHelper.FeatureGateList
> {
  /** Object of Experiments returned from Statsig, with each value a method that returns the current experiment setting */
  public experiments: Record<StatsigHelper.ExperimentKey, () => DynamicConfig>;

  /** Object of FeatureGates returned from Statsig, with each value a method that returns the current feature gate setting */
  public featureGates: Record<StatsigHelper.FeatureGateKey, () => boolean>;

  private options: StatsigHelper.Options;
  private experimentsList: Record<StatsigHelper.ExperimentKey, string>;
  private featureGatesList: Record<StatsigHelper.FeatureGateKey, string>;

  /**
   * Create a Statsig object.
   * @param {StatsigHelper.Initialize<E, F>} params - Constructor params
   * @param {Options} params.options - Initialization option params
   * @param {string} params.options.clientKey - Valid 'Client API Key' in Statsig for the *company-data-covered* organization
   * @param {StatsigUser | null} params.options.user - Specific user to initialize the client
   * @param {StatsigOptions} params.options.options - Additional param to change the default behavior of statsig.initialize.
   * @param {Record<ExperimentKey, string>} params.experimentsList - Object of experiments to return from Statsig, with each value a real experiment ID
   * @param {Record<FeatureGateKey, string>} params.featureGatesList - Object of feature gates to return from Statsig, with each value a real feature gate ID
   */
  constructor({
    options,
    experimentsList,
    featureGatesList,
  }: StatsigHelper.Initialize<E, F>) {
    this.options = options;

    this.experimentsList = experimentsList;
    this.experiments = this.getExperiments();

    this.featureGatesList = featureGatesList;
    this.featureGates = this.getFeatureGates();
  }

  public async initialize() {
    try {
      const { clientKey, user, environment, ...rest } = this.options;

      Cypress.log({
        displayName: 'Starting Statsig Initialization',
        message: `Tier: ${environment?.tier}`,
      });

      await statsig.initialize(clientKey, user, rest);

      Cypress.log({
        displayName: 'Finished Statsig Initialization',
      });
    } catch (error) {
      let message = 'Unknown Error';
      if (error instanceof Error) {
        message = error.message;
      }

      Cypress.log({
        displayName: 'Starting Statsig Initialization Failed',
        message: `Error: ${message}`,
      });
    }
  }

  /* Experiments */
  private getExperiment(name: string): DynamicConfig {
    return statsig.getExperiment(name);
  }

  private getExperiments() {
    const result = {} as typeof this.experiments;
    if (this.experimentsList) {
      const experimentKeys = Object.keys(this.experimentsList);

      for (const key of experimentKeys) {
        result[key] = () => this.getExperiment(this.experimentsList[key]);
      }
    }

    return result;
  }

  /**
   * Override an experiment
   * @param {StatsigHelper.ExperimentKey} key - statsig experiment to override
   * @param {Partial<StatsigHelper.ExperimentOverrideParamMap[StatsigHelper.ExperimentKey]} params - map of param values to use for the override
   * @param {boolean} reload - whether or not to reload the page after overriding
   */
  public overrideExperiment<K extends StatsigHelper.ExperimentKey>(
    key: K,
    params: Partial<StatsigHelper.ExperimentOverrideParamMap[K]>,
    reload = false
  ) {
    const experimentName = this.experimentsList[key];

    Cypress.log({
      displayName: 'Overriding Statsig Config',
      message: `Name: ${experimentName}, Values: ${JSON.stringify(params)}`,
    });

    statsig.overrideConfig(experimentName, params);

    if (reload) {
      cy.reload();
    }
  }

  /**
   * Override multiple experiments
   * @param {} overrides - override params
   * @param {StatsigHelper.ExperimentKey} overrides.key - statsig experiment to override
   * @param {Partial<StatsigHelper.ExperimentOverrideParamMap[StatsigHelper.ExperimentKey]} overrides.params - map of param values to use for the override
   * @param {boolean} reload - whether or not to reload the page after overriding
   */
  public overrideExperiments<K extends StatsigHelper.ExperimentKey>(
    overrides: {
      key: K;
      params: Partial<StatsigHelper.ExperimentOverrideParamMap[K]>;
    }[],
    reload = true
  ) {
    for (const { key, params } of overrides) {
      this.overrideExperiment(key, params, false);
    }

    if (reload) {
      cy.reload();
    }
  }

  /* Feature Gates */
  private getFeatureGate(name: string): boolean {
    return statsig.checkGate(name);
  }

  private getFeatureGates() {
    const result = {} as typeof this.featureGates;
    if (this.featureGatesList) {
      const featureGateKeys = Object.keys(this.featureGatesList);

      for (const key of featureGateKeys) {
        result[key] = () => this.getFeatureGate(this.featureGatesList[key]);
      }
    }

    return result;
  }

  /**
   * Override a feature gate
   * @param {StatsigHelper.FeatureGateKey} key - statsig feature gate to override
   * @param {boolean} value - value to use for the override
   * @param {boolean} reload - whether or not to reload the page after overriding
   */
  public overrideFeatureGate<K extends StatsigHelper.FeatureGateKey>(
    key: K,
    value: boolean,
    reload = false
  ) {
    const gateName = this.featureGatesList[key];

    Cypress.log({
      displayName: 'Overriding Statsig Feature Gate',
      message: `Name: ${gateName}, Values: ${value}`,
    });

    statsig.overrideGate(gateName, value);

    if (reload) {
      cy.reload();
    }
  }

  /**
   * Override multiple feature gates
   * @param {} overrides - override params
   * @param {StatsigHelper.FeatureGateKey} overrides.key - statsig feature gate to override
   * @param {Partial<StatsigHelper.FeatureGateOverrideParamMap[StatsigHelper.FeatureGateKey]} overrides.params - map of param values to use for the override
   * @param {boolean} reload - whether or not to reload the page after overriding
   */
  public overrideFeatureGates<K extends StatsigHelper.FeatureGateKey>(
    overrides: {
      key: K;
      params: Partial<StatsigHelper.FeatureGateOverrideParamMap[K]>;
    }[],
    reload = true
  ) {
    for (const { key, params } of overrides) {
      this.overrideFeatureGate(key, params, false);
    }

    if (reload) {
      cy.reload();
    }
  }
}
