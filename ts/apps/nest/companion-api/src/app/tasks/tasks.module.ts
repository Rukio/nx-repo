import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { CareRequestModule } from '../care-request/care-request.module';
import { TasksService } from './tasks.service';
import { ConsentsModule } from '../consents/consents.module';

@Module({
  imports: [
    DatabaseModule,
    CareRequestModule,
    DashboardModule,
    forwardRef(() => ConsentsModule),
  ],
  controllers: [TasksController],
  providers: [TasksRepository, TasksService],
  exports: [TasksRepository, TasksService],
})
export class TasksModule {}
