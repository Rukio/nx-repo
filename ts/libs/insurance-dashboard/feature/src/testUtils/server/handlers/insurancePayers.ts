import { rest, RestHandler } from 'msw';
import {
  mockedInsurancePayer,
  PAYERS_API_PATH,
  environment,
  PAYER_GROUPS_API_PATH,
  mockedInsurancePayerGroups,
} from '@*company-data-covered*/insurance/data-access';

export const insurancePayersHandlers: RestHandler[] = [
  rest.get(`${environment.serviceURL}${PAYERS_API_PATH}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ payers: [mockedInsurancePayer] }));
  }),
  rest.get(
    `${environment.serviceURL}${PAYERS_API_PATH}/:payerId`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ payer: mockedInsurancePayer }));
    }
  ),
  rest.patch(
    `${environment.serviceURL}${PAYERS_API_PATH}/:payerId`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ payer: mockedInsurancePayer }));
    }
  ),
  rest.post(`${environment.serviceURL}${PAYERS_API_PATH}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ payer: mockedInsurancePayer }));
  }),
  rest.delete(
    `${environment.serviceURL}${PAYERS_API_PATH}/:payerId`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({}));
    }
  ),
  rest.get(
    `${environment.serviceURL}${PAYER_GROUPS_API_PATH}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ payerGroups: mockedInsurancePayerGroups })
      );
    }
  ),
];
