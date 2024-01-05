import { rest, RestHandler } from 'msw';
import {
  mockedInsuranceClassification,
  environment,
} from '@*company-data-covered*/station/data-access';

export const insuranceClassificationsHandler: RestHandler[] = [
  rest.get(
    `${environment.stationURL}/api/insurance_classifications`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json([mockedInsuranceClassification]));
    }
  ),
];
