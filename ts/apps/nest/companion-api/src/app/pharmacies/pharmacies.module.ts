import { forwardRef, Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PharmaciesController } from './pharmacies.controller';
import { PharmaciesRepository } from './pharmacies.repository';

@Module({
  imports: [forwardRef(() => CompanionModule), DashboardModule],
  controllers: [PharmaciesController],
  providers: [PharmaciesRepository],
  exports: [PharmaciesRepository],
})
export class PharmaciesModule {}
