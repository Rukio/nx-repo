import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import ChannelItemsController from './channel-items.controller';
import ChannelItemsService from './channel-items.service';
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
  controllers: [ChannelItemsController],
  providers: [ChannelItemsService],
  exports: [ChannelItemsService, HttpModule],
})
export default class ChannelItemsModule {}
