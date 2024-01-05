import { setupServer } from 'msw/node';
import { patientsHandlers } from './handlers';

export const mswServer = setupServer(...[...patientsHandlers]);
