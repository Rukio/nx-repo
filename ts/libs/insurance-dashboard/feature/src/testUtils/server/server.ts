import { setupServer } from 'msw/node';
import {
  insuranceClassificationsHandlers,
  insuranceNetworksHandlers,
  insurancePayersHandlers,
  modalitiesHandlers,
  serviceLinesHandlers,
  statesHandlers,
  appointmentTypesHandlers,
} from './handlers';

export const mswServer = setupServer(
  ...[
    ...insurancePayersHandlers,
    ...insuranceNetworksHandlers,
    ...insuranceClassificationsHandlers,
    ...statesHandlers,
    ...serviceLinesHandlers,
    ...modalitiesHandlers,
    ...appointmentTypesHandlers,
  ]
);
