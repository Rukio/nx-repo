import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import LoggerModule from '../logger/logger.module';
import MarketController from './market.controller';
import MarketService from './market.service';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService, HttpModule],
})
export default class MarketAvailabilityModule {}
