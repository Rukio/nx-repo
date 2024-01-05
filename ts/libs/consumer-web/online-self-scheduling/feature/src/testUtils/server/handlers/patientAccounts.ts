import {
  buildAddUnverifiedAccountPatientLinkPath,
  buildPatientAccountCheckEligibilityPath,
  buildPatientAccountInsurancesPath,
  buildPatientAccountPatientsPath,
  buildPatientAccountPath,
  buildPatientAccountAddressPath,
  environment,
  mockAccountPatients,
  mockInsurance,
  mockInsuranceWithEligibleStatus,
  mockPatientAccount,
  mockCreatePatientAccountAddressResponse,
  mockPatientAccountPatientLink,
  mockPatientAccountUnverifiedPatient,
  PATIENT_ACCOUNTS_API_PATH,
  mockDomainPatientAccountAddress,
  buildCreatePatientEhrRecordPath,
  buildPatientAccountInsurancePath,
  buildAccountPatientPath,
  mockDeletePatientInsuranceSuccessfulResponse,
  mockPatient,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { rest, RestHandler } from 'msw';

export const buildGetAccountApiPath = () =>
  `${environment.serviceURL}${PATIENT_ACCOUNTS_API_PATH}`;

export const buildUpdateAccountApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountPath(':id')}`;

export const buildGetAccountPatientsApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountPatientsPath(':id')}`;

export const buildPatientAccountAddressApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountAddressPath(':accountId')}`;

export const buildCreateUnverifiedPatientLinkApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountPatientsPath(':id')}`;

export const buildAddUnverifiedAccountPatientLinkApiPath = () =>
  `${environment.serviceURL}${buildAddUnverifiedAccountPatientLinkPath(':id')}`;

export const buildCreatePatientEhrRecordApiPath = () =>
  `${environment.serviceURL}${buildCreatePatientEhrRecordPath(':accountId')}`;

export const buildPatientAccountCreateInsuranceApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountInsurancesPath(':accountId')}`;

export const buildPatientAccountCheckEligibilityApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountCheckEligibilityPath(
    ':accountId',
    ':insuranceId'
  )}`;

export const buildPatientAccountGetInsurancesApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountInsurancesPath(':accountId')}`;

export const buildPatientAccountInsuranceApiPath = () =>
  `${environment.serviceURL}${buildPatientAccountInsurancePath(
    ':accountId',
    ':insuranceId'
  )}`;

export const buildAccountPatientApiPath = () =>
  `${environment.serviceURL}${buildAccountPatientPath(
    ':accountId',
    ':patientId'
  )}`;

export const patientAccountsHandlers: RestHandler[] = [
  rest.get(buildGetAccountApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockPatientAccount }));
  }),
  rest.patch(buildUpdateAccountApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockPatientAccount }));
  }),
  rest.get(buildGetAccountPatientsApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockAccountPatients }));
  }),
  rest.post(buildPatientAccountAddressApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ data: mockCreatePatientAccountAddressResponse })
    );
  }),
  rest.post(buildCreateUnverifiedPatientLinkApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockPatientAccountUnverifiedPatient })
    );
  }),
  rest.patch(
    buildAddUnverifiedAccountPatientLinkApiPath(),
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ data: mockPatientAccountPatientLink })
      );
    }
  ),
  rest.get(buildPatientAccountAddressApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: [mockDomainPatientAccountAddress] })
    );
  }),
  rest.post(buildCreatePatientEhrRecordApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockPatient }));
  }),
  rest.post(buildPatientAccountCreateInsuranceApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockInsurance }));
  }),
  rest.post(buildPatientAccountCheckEligibilityApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockInsuranceWithEligibleStatus })
    );
  }),
  rest.get(buildPatientAccountGetInsurancesApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: [] }));
  }),
  rest.put(buildPatientAccountInsuranceApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockInsuranceWithEligibleStatus })
    );
  }),
  rest.patch(buildAccountPatientApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockPatientAccountUnverifiedPatient })
    );
  }),
  rest.delete(buildPatientAccountInsuranceApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockDeletePatientInsuranceSuccessfulResponse)
    );
  }),
  rest.get(buildAccountPatientApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockPatient }));
  }),
];
