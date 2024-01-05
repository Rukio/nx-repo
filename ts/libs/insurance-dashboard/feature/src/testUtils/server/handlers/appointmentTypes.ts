import { rest, RestHandler } from 'msw';
import {
  environment,
  mockedAppointmentTypesPathList,
  buildAppointmentTypesPath,
} from '@*company-data-covered*/insurance/data-access';

export const appointmentTypesHandlers: RestHandler[] = [
  rest.get(
    `${environment.serviceURL}${buildAppointmentTypesPath()}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ appointmentTypes: mockedAppointmentTypesPathList })
      );
    }
  ),
];
