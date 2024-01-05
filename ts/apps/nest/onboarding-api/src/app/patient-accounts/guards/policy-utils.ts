import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const JWT_USER_TYPE_KEY = 'https://*company-data-covered*.com/type';
export const JWT_USER_PROPS_KEY = 'https://*company-data-covered*.com/props';

export const BELONGS_TO_ACCOUNT_POLICY = 'patient_accounts.belongs_to_account';

export const REQUIRED_ACCOUNT_ID_MSG = 'Account ID is required!';
export const REQUIRED_PATIENT_ID_MSG = 'Patient ID is required!';
export const REQUIRED_UNVERIFIED_PATIENT_ID_MSG =
  'Unverified Patient ID is required!';

export const accountIdFromRequest = (request: Request) => {
  const accountId = parseInt(request.params.accountId);

  if (!accountId) {
    throw new BadRequestException(REQUIRED_ACCOUNT_ID_MSG);
  }

  return accountId;
};

const pullVarFromRequest = (
  request: Request,
  varKey: 'patientId' | 'unverifiedPatientId'
) => {
  return (
    request.params[varKey] ||
    request.query[varKey] ||
    request.body?.[varKey]?.toString()
  );
};

export const patientIdFromRequest = (request: Request) => {
  const patientId: string = pullVarFromRequest(request, 'patientId');

  if (!patientId) {
    throw new BadRequestException(REQUIRED_PATIENT_ID_MSG);
  }

  return patientId;
};

export const unverifiedPatientIdFromRequest = (request: Request) => {
  const unverifiedPatientId: string = pullVarFromRequest(
    request,
    'unverifiedPatientId'
  );

  if (!unverifiedPatientId) {
    throw new BadRequestException(REQUIRED_UNVERIFIED_PATIENT_ID_MSG);
  }

  return unverifiedPatientId;
};

export const getPatientActor = (user: Express.User, properties: object) => ({
  type: user[JWT_USER_TYPE_KEY],
  properties: { ...user[JWT_USER_PROPS_KEY], ...properties },
});
