import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import LoggerModule from '../logger/logger.module';
import StateController from './state.controller';
import StateService from './state.service';
import StationModule from '../station/station.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    StationModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [StateController],
  providers: [StateService],
  exports: [StateService, HttpModule],
})
export default class StateModule {}
