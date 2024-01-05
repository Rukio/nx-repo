import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PolicyService } from '@*company-data-covered*/nest/policy';
import PatientAccountsService from './../patient-accounts.service';
import {
  BELONGS_TO_ACCOUNT_POLICY,
  accountIdFromRequest,
  getPatientActor,
  unverifiedPatientIdFromRequest,
} from './policy-utils';

@Injectable()
export class UnverifiedPatientOwnerGuard implements CanActivate {
  constructor(
    private readonly patientAccountsService: PatientAccountsService,
    private readonly policyService: PolicyService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const accountId = accountIdFromRequest(req);
    const requestedUnverifiedPatientId = unverifiedPatientIdFromRequest(req);

    const accountPatients = await this.patientAccountsService.listPatients(
      accountId
    );

    const unverifiedPatients = accountPatients
      .map(({ unverifiedPatient }) => unverifiedPatient?.id?.toString())
      .filter(Boolean);

    return this.policyService.allowed(
      BELONGS_TO_ACCOUNT_POLICY,
      getPatientActor(req.user, { unverified_patients: unverifiedPatients }),
      {
        unverified_patient_id: requestedUnverifiedPatientId,
      }
    );
  }
}
