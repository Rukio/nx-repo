import {
  environment,
  buildStatesPath,
  mockStates,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { rest, RestHandler } from 'msw';

export const buildStatesApiPath = () =>
  `${environment.serviceURL}${buildStatesPath()}`;

export const statesHandlers: RestHandler[] = [
  rest.get(buildStatesApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockStates }));
  }),
];
