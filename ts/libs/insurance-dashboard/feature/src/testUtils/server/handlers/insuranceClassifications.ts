import { rest, RestHandler } from 'msw';
import {
  environment,
  INSURANCE_CLASSIFICATIONS_API_PATH,
  mockedInsuranceClassifications,
} from '@*company-data-covered*/insurance/data-access';

export const insuranceClassificationsHandlers: RestHandler[] = [
  rest.get(
    `${environment.serviceURL}${INSURANCE_CLASSIFICATIONS_API_PATH}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ insuranceClassifications: mockedInsuranceClassifications })
      );
    }
  ),
];
