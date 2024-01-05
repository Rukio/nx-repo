import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import PartnerLinesController from './partner-lines.controller';
import PartnerLinesService from './partner-lines.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [PartnerLinesController],
  providers: [PartnerLinesService],
  exports: [PartnerLinesService, HttpModule],
})
export default class PartnerLinesModule {}
