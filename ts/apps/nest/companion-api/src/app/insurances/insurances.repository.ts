import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardInsurance } from '../dashboard/types/dashboard-insurance';
import { Priority } from '../dashboard/types/priority';
import { InsuranceCardType } from './interfaces/insurance_card_type.interface';

@Injectable()
export class InsurancesRepository {
  constructor(private dashboard: DashboardService) {}

  static filterInsuranceByPriority = (
    insurances: DashboardInsurance[],
    priority: Priority
  ): DashboardInsurance | undefined => {
    return insurances.find((ins) => ins.priority === priority);
  };

  async uploadImagesByInsurancePriority(
    careRequestId: number,
    priority: Priority,
    cardFront?: Express.Multer.File,
    cardBack?: Express.Multer.File
  ) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        'Care request associated to Companion link not found.'
      );
    }

    const insurancesResp = await this.dashboard.getPatientInsurances(
      careRequest.patientId
    );
    const insurance = InsurancesRepository.filterInsuranceByPriority(
      insurancesResp,
      priority
    );

    if (!insurance) {
      throw new NotFoundException(
        'Patient insurance with matching priority not found.'
      );
    }

    await this.dashboard.uploadInsurance(
      careRequest.patientId,
      careRequest.id,
      insurance.id,
      cardFront,
      cardBack
    );
  }

  async getPatientInsurancesByCareRequestId(careRequestId: number) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        `Care request not found. Unable to get patient insurances.`
      );
    }

    return this.dashboard.getPatientInsurances(careRequest.patientId);
  }

  async deleteInsuranceImages(
    careRequestId: number,
    priority: Priority,
    cardType: InsuranceCardType
  ) {
    const careRequest = await this.dashboard.getCareRequestById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        'Care request associated to Companion link not found.'
      );
    }

    const patientInsurances = await this.dashboard.getPatientInsurances(
      careRequest.patientId
    );
    const insurance = InsurancesRepository.filterInsuranceByPriority(
      patientInsurances,
      priority
    );

    if (!insurance) {
      throw new NotFoundException(
        `Patient insurance with matching priority not found.`
      );
    }

    await this.dashboard.deleteInsuranceImageByType(
      careRequest.patientId,
      careRequest.id,
      insurance.id,
      cardType
    );
  }
}
