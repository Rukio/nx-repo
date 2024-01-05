import { rest, RestHandler } from 'msw';
import {
  environment,
  MODALITIES_API_PATH,
  mockedModalitiesList,
} from '@*company-data-covered*/insurance/data-access';

export const modalitiesHandlers: RestHandler[] = [
  rest.get(
    `${environment.serviceURL}${MODALITIES_API_PATH}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ modalities: mockedModalitiesList })
      );
    }
  ),
];
