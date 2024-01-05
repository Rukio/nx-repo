import { rest, RestHandler } from 'msw';
import {
  mockedInsurancePlan,
  environment,
} from '@*company-data-covered*/station/data-access';

export const insurancePlansHandler: RestHandler[] = [
  rest.get(
    `${environment.stationURL}/api/markets/:marketId/insurance_plans/search`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          Array.from(Array(15)).map((_, index) => ({
            ...mockedInsurancePlan,
            id: mockedInsurancePlan.id + index,
            name: mockedInsurancePlan.name + index,
          }))
        )
      );
    }
  ),
];
