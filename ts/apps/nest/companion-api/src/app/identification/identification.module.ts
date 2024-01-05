import { forwardRef, Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { IdentificationController } from './identification.controller';
import { IdentificationRepository } from './identification.repository';

@Module({
  imports: [forwardRef(() => CompanionModule), DashboardModule],
  controllers: [IdentificationController],
  providers: [IdentificationRepository],
  exports: [IdentificationRepository],
})
export class IdentificationModule {}
