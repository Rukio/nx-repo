import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import LoggerModule from '../logger/logger.module';
import MarketAvailabilityController from './market-availability.controller';
import MarketAvailabilityService from './market-availability.service';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [MarketAvailabilityController],
  providers: [MarketAvailabilityService],
  exports: [MarketAvailabilityService, HttpModule],
})
export default class MarketAvailabilityModule {}
