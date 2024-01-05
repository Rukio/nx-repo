import {
  environment,
  buildZipcodePath,
  mockMarketsAvailabilityZipCode,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { rest, RestHandler } from 'msw';

export const buildMarketsAvailabilityZipcodeApiPath = () =>
  `${environment.serviceURL}${buildZipcodePath()}`;

export const marketsAvailabilityHandlers: RestHandler[] = [
  rest.get(buildMarketsAvailabilityZipcodeApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockMarketsAvailabilityZipCode })
    );
  }),
];
