import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import RiskStratificationProtocolsController from './risk-stratification-protocols.controller';
import RiskStratificationProtocolsService from './risk-stratification-protocols.service';
import LoggerModule from '../logger/logger.module';
import StationModule from '../station/station.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    StationModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [RiskStratificationProtocolsController],
  providers: [RiskStratificationProtocolsService],
  exports: [RiskStratificationProtocolsService, HttpModule],
})
export default class RiskStratificationProtocolsModule {}
