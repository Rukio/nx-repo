import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import SelfScheduleController from './self-schedule.controller';
import SelfScheduleService from './self-schedule.service';
import LoggerModule from '../logger/logger.module';
import StationModule from '../station/station.module';
import { RedisModule } from '@*company-data-covered*/nest/redis';
import { RedisConfigurationFactory } from '../configuration/redis.configuration.factory';
import InsuranceNetworksModule from '../insurance-networks/insurance-networks.module';
import { PolicyModule } from '@*company-data-covered*/nest/policy';
import { PolicyConfigurationFactory } from '../configuration/policy.configuration.factory';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    StationModule,
    InsuranceNetworksModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
    RedisModule.registerAsync({
      useClass: RedisConfigurationFactory,
    }),
    PolicyModule.forRootAsync({
      useClass: PolicyConfigurationFactory,
    }),
  ],
  controllers: [SelfScheduleController],
  providers: [SelfScheduleService],
  exports: [SelfScheduleService, HttpModule],
})
export default class SelfScheduleModule {}
