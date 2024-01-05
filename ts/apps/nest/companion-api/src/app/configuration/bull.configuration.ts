import { Injectable } from '@nestjs/common';
import {
  BullModuleOptions,
  SharedBullConfigurationFactory,
} from '@nestjs/bull';
import { InjectRedisOptions } from '../redis';
import { RedisOptions } from 'ioredis';
@Injectable()
export class BullConfigService implements SharedBullConfigurationFactory {
  constructor(@InjectRedisOptions() private redisOpts: RedisOptions) {}

  createSharedConfiguration(): BullModuleOptions {
    return {
      redis: this.redisOpts,
    };
  }
}
