import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import CareRequestController from './care-request.controller';
import CareRequestService from './care-request.service';
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
  controllers: [CareRequestController],
  providers: [CareRequestService],
  exports: [CareRequestService, HttpModule],
})
export default class CareRequestModule {}
