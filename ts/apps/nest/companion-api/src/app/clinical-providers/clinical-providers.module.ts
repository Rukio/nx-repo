import { forwardRef, Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ClinicalProvidersController } from './clinical-providers.controller';
import { ClinicalProvidersRepository } from './clinical-providers.repository';

@Module({
  imports: [forwardRef(() => CompanionModule), DashboardModule],
  controllers: [ClinicalProvidersController],
  providers: [ClinicalProvidersRepository],
  exports: [ClinicalProvidersRepository],
})
export class ClinicalProvidersModule {}
