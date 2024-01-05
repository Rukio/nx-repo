import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { StatsigModuleOptions } from './interfaces';
import * as statsig from 'statsig-node';
import { InjectStatsigOptions } from './common';

@Injectable()
export class StatsigService implements OnModuleInit, OnModuleDestroy {
  private preferences: StatsigModuleOptions;

  constructor(@InjectStatsigOptions() preferences: StatsigModuleOptions) {
    this.preferences = preferences;
  }

  async onModuleInit() {
    await this.initialize();
  }

  onModuleDestroy() {
    this.shutdown();
  }

  private async initialize() {
    await statsig.initialize(
      this.preferences.secretApiKey,
      this.preferences.options
    );
  }

  async checkGate(...args: Parameters<typeof statsig.checkGate>) {
    return statsig.checkGate(...args);
  }

  async getConfig(...args: Parameters<typeof statsig.getConfig>) {
    return statsig.getConfig(...args);
  }

  async getExperiment(...args: Parameters<typeof statsig.getExperiment>) {
    return statsig.getExperiment(...args);
  }

  async experimentIsEnabled(
    statsigUser: statsig.StatsigUser,
    experimentName: string
  ): Promise<boolean> {
    return this.getExperimentParameter(statsigUser, experimentName, 'enabled');
  }

  async getExperimentParameter(
    statsigUser: statsig.StatsigUser,
    experimentName: string,
    parameterKey: string
  ): Promise<boolean> {
    const experiment = await statsig.getExperiment(statsigUser, experimentName);

    return experiment.get<boolean>(parameterKey, false);
  }

  async logEvent(...args: Parameters<typeof statsig.logEvent>) {
    return statsig.logEvent(...args);
  }

  shutdown() {
    return statsig.shutdown();
  }
}
