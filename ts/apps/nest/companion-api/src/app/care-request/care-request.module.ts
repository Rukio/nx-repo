import { Module } from '@nestjs/common';
import { CareRequestRepository } from './care-request.repository';
import { DashboardModule } from '../dashboard/dashboard.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DashboardModule, DatabaseModule],
  providers: [CareRequestRepository],
  exports: [CareRequestRepository],
})
export class CareRequestModule {}
