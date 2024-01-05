import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpHealthIndicator } from '@nestjs/terminus';
import { CacheConfigService } from '../common/cache.config.service';
import ClientConfigController from './client-config.controller';
import ClientConfigService from './client-config.service';
import LoggerModule from '../logger/logger.module';
import ClientConfigHealthIndicator from './client-config.health';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [ClientConfigController],
  providers: [
    ClientConfigService,
    ClientConfigHealthIndicator,
    HttpHealthIndicator,
  ],
  exports: [ClientConfigService, ClientConfigHealthIndicator, HttpModule],
})
export default class ClientConfigModule {}
