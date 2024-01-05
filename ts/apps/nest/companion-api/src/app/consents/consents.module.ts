import { forwardRef, Module } from '@nestjs/common';
import { CaravanModule } from '../caravan/caravan.module';
import { CareRequestModule } from '../care-request/care-request.module';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { TasksModule } from '../tasks/tasks.module';
import { ConsentsController } from './consents.controller';
import { ConsentsRepository } from './consents.repository';
import { ConsentsService } from './consents.service';

@Module({
  imports: [
    forwardRef(() => CompanionModule),
    forwardRef(() => TasksModule),
    DashboardModule,
    CareRequestModule,
    CaravanModule,
  ],
  controllers: [ConsentsController],
  providers: [ConsentsRepository, ConsentsService],
  exports: [ConsentsRepository, ConsentsService],
})
export class ConsentsModule {}
