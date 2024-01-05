import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { CareRequestNotFoundException } from './common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CareRequestRepository {
  constructor(
    private dashboardService: DashboardService,
    private database: DatabaseService
  ) {}

  /**
   * Retrieves a care request using the given ID.
   *
   * Returns null if a care request with the specified ID does not exist.
   */
  async getById(careRequestId: number) {
    return this.dashboardService.getCareRequestById(careRequestId);
  }

  /**
   * Retrieves a care request using the given ID.
   *
   * Throws CareRequestNotFoundException if the care request is not found.
   */
  async getByIdWithError(careRequestId: number) {
    const result = await this.getById(careRequestId);

    if (!result) {
      throw new CareRequestNotFoundException(careRequestId);
    }

    return result;
  }

  async getByLinkId(id: string) {
    const link = await this.database.companionLink.findUnique({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException(id);
    }

    return this.getByIdWithError(link.careRequestId);
  }
}
