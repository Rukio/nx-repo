import { Injectable } from '@nestjs/common';
import { StatsD } from 'hot-shots';
import { InjectDatadogOptions } from './common';
import { DatadogModuleOptions } from './datadog.module-definition';

@Injectable()
export class DatadogService extends StatsD {
  constructor(@InjectDatadogOptions() options: DatadogModuleOptions) {
    super(options);
  }
}
