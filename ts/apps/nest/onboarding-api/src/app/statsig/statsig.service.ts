import { Injectable } from '@nestjs/common';
import * as statsig from 'statsig-node';
import { StatsigUser } from 'statsig-node';
import { StatsigModuleOptions } from './interfaces';
import { InjectStatsigOptions } from './common';

const DUMMY_USER_ID = 'dummyID';

@Injectable()
export default class StatsigService {
  private preferences: StatsigModuleOptions;

  constructor(@InjectStatsigOptions() preferences: StatsigModuleOptions) {
    this.preferences = preferences;
  }

  async initialize() {
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

  async logEvent(...args: Parameters<typeof statsig.logEvent>) {
    return statsig.logEvent(...args);
  }

  async overrideGate(gateName: string, value: boolean) {
    return statsig.overrideGate(gateName, value);
  }

  shutdown() {
    return statsig.shutdown();
  }

  async patientServiceToggle(email: string): Promise<boolean> {
    try {
      const user: StatsigUser = {
        email,
        userID: DUMMY_USER_ID,
      };

      return await this.checkGate(user, 'onboarding_patient_service_toggle');
    } catch {
      return false;
    }
  }
}
