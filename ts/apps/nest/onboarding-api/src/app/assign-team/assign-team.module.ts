import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import AssignTeamService from './assign-team.service';
import AssignTeamController from './assign-team.controller';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [AssignTeamController],
  providers: [AssignTeamService],
  exports: [AssignTeamService, HttpModule],
})
export default class AssignTeamModule {}
