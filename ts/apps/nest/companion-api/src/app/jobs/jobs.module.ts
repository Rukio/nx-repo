import { Module } from '@nestjs/common';
import { CareRequestModule } from '../care-request/care-request.module';
import { ConfigModule } from '@nestjs/config';
import { RunningLateSmsProcessor } from './processors/running-late-sms-processor';
import { CommunicationsModule } from '../communications/communications.module';
import { BullModule } from '@nestjs/bull';
import { RUNNING_LATE_SMS_QUEUE } from './common/jobs.constants';
import { JobsService } from './jobs.service';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule,
    CareRequestModule,
    CommunicationsModule,
    DashboardModule,
    BullModule.registerQueue({ name: RUNNING_LATE_SMS_QUEUE }),
  ],
  providers: [JobsService, RunningLateSmsProcessor],
  exports: [JobsService],
})
export class JobsModule {}
