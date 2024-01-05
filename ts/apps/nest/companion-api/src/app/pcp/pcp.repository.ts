import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { PrimaryCareProvider } from './interfaces/pcp.interface';

@Injectable()
export class PcpRepository {
  constructor(private dashboard: DashboardService) {}

  async setPrimaryCareProvider(
    careRequestId: number,
    pcp: PrimaryCareProvider
  ) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        'Care request associated to Companion link not found'
      );
    }

    await this.dashboard.setPrimaryCareProvider(
      careRequestId,
      careRequest.patientId,
      pcp
    );
  }

  async getPrimaryCareProviderEhrIdByCareRequestId(
    careRequestId: number
  ): Promise<string | null> {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        'Care request associated to Companion link not found'
      );
    }

    return this.dashboard.getPrimaryCareProviderEhrIdByPatientId(
      careRequest.patientId
    );
  }
}
