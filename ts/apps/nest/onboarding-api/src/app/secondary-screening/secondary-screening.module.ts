import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import SecondaryScreeningController from './secondary-screening.controller';
import SecondaryScreeningService from './secondary-screening.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [SecondaryScreeningController],
  providers: [SecondaryScreeningService],
  exports: [SecondaryScreeningService, HttpModule],
})
export default class SecondaryScreeningModule {}
