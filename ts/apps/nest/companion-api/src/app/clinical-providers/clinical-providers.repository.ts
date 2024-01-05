import { Injectable } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { ClinicalProviderSearchParams } from './interfaces/clinical-provider';

@Injectable()
export class ClinicalProvidersRepository {
  constructor(private dashboard: DashboardService) {}

  async searchClinicalProviders(
    providerSearchParams: ClinicalProviderSearchParams
  ) {
    return this.dashboard.searchClinicalProviders(providerSearchParams);
  }
}
