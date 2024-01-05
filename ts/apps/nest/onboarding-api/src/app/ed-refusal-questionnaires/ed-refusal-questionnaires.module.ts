import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheConfigService } from '../common/cache.config.service';

import EdRefusalQuestionnairesController from './ed-refusal-questionnaires.controller';
import EdRefusalQuestionnairesService from './ed-refusal-questionnaires.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [EdRefusalQuestionnairesController],
  providers: [EdRefusalQuestionnairesService],
  exports: [EdRefusalQuestionnairesService, HttpModule],
})
export default class EdRefusalQuestionnairesModule {}
