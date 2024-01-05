import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import InsuranceController from './insurance.controller';
import InsuranceService from './insurance.service';
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
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService, HttpModule],
})
export default class InsuranceModule {}
