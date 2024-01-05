import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import PlacesOfServiceController from './places-of-service.controller';
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
  controllers: [PlacesOfServiceController],
  exports: [HttpModule],
})
export default class PlacesOfServiceModule {}
