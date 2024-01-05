import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import { RiskAssessmentController } from './risk-assessment.controller';
import RiskAssessmentService from './risk-assessment.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [RiskAssessmentController],
  providers: [RiskAssessmentService],
  exports: [RiskAssessmentService, HttpModule],
})
export default class RiskAssessmentsModule {}
