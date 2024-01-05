import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import { ServiceLinesController } from './service-lines.controller';
import ServiceLinesService from './service-lines.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [ServiceLinesController],
  providers: [ServiceLinesService],
  exports: [ServiceLinesService, HttpModule],
})
export default class ServiceLinesModule {}
