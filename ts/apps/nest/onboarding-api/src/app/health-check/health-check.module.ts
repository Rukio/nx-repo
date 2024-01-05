import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import HealthCheckController from './health-check.controller';
import HealthCheckService from './health-check.service';
import ClientConfigModule from '../client-config/client-config.module';
import { CacheConfigService } from '../common/cache.config.service';

@Module({
  imports: [
    TerminusModule,
    ConfigModule,
    ClientConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  controllers: [HealthCheckController],
  providers: [HealthCheckService],
})
export default class HealthCheckModule {}
