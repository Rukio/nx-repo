import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';

@Injectable()
export class IdentificationRepository {
  constructor(private dashboard: DashboardService) {}

  async uploadImageByCareRequestId(
    careRequestId: number,
    file: Express.Multer.File
  ) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        `Care request not found. Unable to upload driver's license.`
      );
    }

    await this.dashboard.uploadPatientDriversLicense(
      careRequest.patientId,
      file
    );
  }

  async getDriversLicenseByCareRequestId(careRequestId: number) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        `Care request not found. Unable to get driver's license.`
      );
    }

    return this.dashboard.getDriversLicenseByPatientId(careRequest.patientId);
  }

  async deleteDriversLicenseByCareRequestId(careRequestId: number) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        `Care request not found. Unable to delete driver's license.`
      );
    }

    const driversLicense = await this.dashboard.getDriversLicenseByPatientId(
      careRequest.patientId
    );

    if (!driversLicense) {
      throw new BadRequestException(
        `Driver's license for patient does not exist!`
      );
    }

    await this.dashboard.deleteDriversLicenseById(
      careRequest.patientId,
      driversLicense.id
    );
  }
}
