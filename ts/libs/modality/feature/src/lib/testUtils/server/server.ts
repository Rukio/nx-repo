import { setupServer } from 'msw/node';
import {
  serviceLinesHandlers,
  marketsHandlers,
  modalitiesHandlers,
  insuranceClassificationsHandler,
  insurancePlansHandler,
  insuranceNetworksHandler,
} from './handlers';

export const mswServer = setupServer(
  ...[
    ...serviceLinesHandlers,
    ...marketsHandlers,
    ...modalitiesHandlers,
    ...insuranceClassificationsHandler,
    ...insurancePlansHandler,
    ...insuranceNetworksHandler,
  ]
);
