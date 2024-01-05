import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Analytics,
  IdentifyParams,
  TrackParams,
} from '@segment/analytics-node';
import { SegmentModuleOptions } from './interfaces';
import { InjectSegmentOptions } from './common';

@Injectable()
export class SegmentService implements OnModuleInit, OnModuleDestroy {
  private analyticsInstance!: Analytics;
  private preferences: SegmentModuleOptions;

  constructor(@InjectSegmentOptions() preferences: SegmentModuleOptions) {
    this.preferences = preferences;
  }

  onModuleInit() {
    this.initialize();
  }

  onModuleDestroy() {
    this.shutdown();
  }

  private initialize() {
    this.analyticsInstance = new Analytics(
      this.preferences.initializationSettings
    );
  }

  private async callAsync<fnParamsType>(
    fn: (params: fnParamsType, callback: (err?: unknown) => void) => void,
    params: fnParamsType
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      fn.call(this, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async identify<P extends IdentifyParams>(params: P) {
    return this.callAsync(this.analyticsInstance.identify, params);
  }

  async track<P extends TrackParams>(params: P) {
    return this.callAsync(this.analyticsInstance.track, params);
  }

  shutdown() {
    return this.analyticsInstance.closeAndFlush();
  }
}
