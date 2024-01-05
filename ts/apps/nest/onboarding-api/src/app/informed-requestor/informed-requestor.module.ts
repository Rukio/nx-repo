import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import InformedRequestorsController from './informed-requestor.controller';
import InformedRequestorsService from './informed-requestor.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [InformedRequestorsController],
  providers: [InformedRequestorsService],
  exports: [InformedRequestorsService, HttpModule],
})
export default class InformedRequestorsModule {}
