import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import InsurancePlansController from './insurance-plans.controller';
import InsurancePlansService from './insurance-plans.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [InsurancePlansController],
  providers: [InsurancePlansService],
  exports: [InsurancePlansService, HttpModule],
})
export default class InsurancePlansModule {}
