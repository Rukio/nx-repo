import { rest, RestHandler } from 'msw';
import {
  mockedModalitiesList,
  environment,
  mockedMarketsModalityConfigs,
  mockedModalityConfigsList,
  mockedNetworksModalityConfigs,
} from '@*company-data-covered*/station/data-access';

export const modalitiesHandlers: RestHandler[] = [
  rest.get(`${environment.stationURL}/api/modalities`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ modalities: mockedModalitiesList }));
  }),
  rest.get(
    `${environment.stationURL}/api/modalities/configs`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockedModalityConfigsList));
    }
  ),
  rest.patch(
    `${environment.stationURL}/api/modalities/configs`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockedModalityConfigsList));
    }
  ),
  rest.get(
    `${environment.stationURL}/api/modalities/market-configs`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockedMarketsModalityConfigs));
    }
  ),
  rest.patch(
    `${environment.stationURL}/api/modalities/market-configs`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockedMarketsModalityConfigs));
    }
  ),
  rest.get(
    `${environment.stationURL}/api/modalities/network-configs`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockedNetworksModalityConfigs));
    }
  ),
];
