import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { Pharmacy } from './interfaces/pharmacy.interface';

@Injectable()
export class PharmaciesRepository {
  constructor(private dashboard: DashboardService) {}

  async setDefaultPharmacy(careRequestId: number, pharmacy: Pharmacy) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        'Care request associated to Companion link not found'
      );
    }
    await this.dashboard.setDefaultPharmacy(careRequest.patientId, pharmacy);
  }

  async getDefaultPharmacyByCareRequestId(careRequestId: number) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        'Care request associated to Companion link not found'
      );
    }

    return this.dashboard.getDefaultPharmacyByPatientId(careRequest.patientId);
  }
}
