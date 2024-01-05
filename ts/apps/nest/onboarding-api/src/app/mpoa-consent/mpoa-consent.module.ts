import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import MpoaConsentController from './mpoa-consent.controller';
import MpoaConsentService from './mpoa-consent.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [MpoaConsentController],
  providers: [MpoaConsentService],
  exports: [MpoaConsentService, HttpModule],
})
export default class MpoaConsentModule {}
