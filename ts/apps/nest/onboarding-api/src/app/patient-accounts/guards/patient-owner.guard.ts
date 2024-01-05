import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PolicyService } from '@*company-data-covered*/nest/policy';
import PatientAccountsService from './../patient-accounts.service';
import {
  BELONGS_TO_ACCOUNT_POLICY,
  accountIdFromRequest,
  getPatientActor,
  patientIdFromRequest,
} from './policy-utils';

@Injectable()
export class PatientOwnerGuard implements CanActivate {
  constructor(
    private readonly patientAccountsService: PatientAccountsService,
    private readonly policyService: PolicyService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const accountId = accountIdFromRequest(req);
    const requestedPatientId = patientIdFromRequest(req);

    const accountPatients = await this.patientAccountsService.listPatients(
      accountId
    );

    const patients = accountPatients
      .map(
        ({ patient, unverifiedPatient }) =>
          patient?.id?.toString() || unverifiedPatient?.patientId?.toString()
      )
      .filter(Boolean);

    return this.policyService.allowed(
      BELONGS_TO_ACCOUNT_POLICY,
      getPatientActor(req.user, { patients }),
      {
        patient_id: requestedPatientId,
      }
    );
  }
}
