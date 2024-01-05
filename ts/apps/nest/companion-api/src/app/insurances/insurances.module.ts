import { forwardRef, Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { InsurancesController } from './insurances.controller';
import { InsurancesRepository } from './insurances.repository';

@Module({
  imports: [forwardRef(() => CompanionModule), DashboardModule],
  controllers: [InsurancesController],
  providers: [InsurancesRepository],
  exports: [InsurancesRepository],
})
export class InsurancesModule {}
