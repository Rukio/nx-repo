import { setupServer } from 'msw/node';

import {
  marketsAvailabilityHandlers,
  selfScheduleHandlers,
  patientAccountsHandlers,
  statesHandlers,
  marketsHandlers,
} from './handlers';

export const mswServer = setupServer(
  ...[...marketsAvailabilityHandlers],
  ...[...selfScheduleHandlers],
  ...[...patientAccountsHandlers],
  ...[...statesHandlers],
  ...[...marketsHandlers]
);
