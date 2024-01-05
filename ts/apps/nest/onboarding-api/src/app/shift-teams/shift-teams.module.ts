import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import ShiftTeamsService from './shift-teams.service';
import ShiftTeamsController from './shift-teams.controller';
import { CacheConfigService } from '../common/cache.config.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [ShiftTeamsController],
  providers: [ShiftTeamsService],
  exports: [ShiftTeamsService, HttpModule],
})
export default class ShiftTeamsModule {}
