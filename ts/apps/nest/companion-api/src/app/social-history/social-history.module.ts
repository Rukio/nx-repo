import { forwardRef, Module } from '@nestjs/common';
import { CareRequestModule } from '../care-request/care-request.module';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { TasksModule } from '../tasks/tasks.module';
import { SocialHistoryController } from './social-history.controller';
import { SocialHistoryRepository } from './social-history.repository';

@Module({
  imports: [
    forwardRef(() => CompanionModule),
    DashboardModule,
    TasksModule,
    CareRequestModule,
  ],
  controllers: [SocialHistoryController],
  providers: [SocialHistoryRepository],
  exports: [SocialHistoryRepository],
})
export class SocialHistoryModule {}
