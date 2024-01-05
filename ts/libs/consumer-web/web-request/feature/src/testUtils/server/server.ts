import { setupServer } from 'msw/node';
import {
  serviceAreasHandlers,
  zipCodesHandlers,
  marketsHandlers,
  careRequestsHandlers,
} from './handlers';

export const mswServer = setupServer(
  ...[
    ...serviceAreasHandlers,
    ...marketsHandlers,
    ...zipCodesHandlers,
    ...careRequestsHandlers,
  ]
);
