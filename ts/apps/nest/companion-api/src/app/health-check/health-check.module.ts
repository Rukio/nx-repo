import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { DashboardModule } from '../dashboard/dashboard.module';
import { DatabaseModule } from '../database/database.module';
import { HealthCheckController } from './health-check.controller';
import { HealthService } from './health.service';
import { RedisHealthModule } from '../redis';

@Module({
  imports: [
    TerminusModule,
    ConfigModule,
    DashboardModule,
    DatabaseModule,
    RedisHealthModule,
  ],
  controllers: [HealthCheckController],
  providers: [HealthService],
})
export class HealthCheckModule {}
