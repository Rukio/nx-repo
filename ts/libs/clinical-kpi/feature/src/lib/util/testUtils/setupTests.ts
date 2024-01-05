import 'jest-fetch-mock';
import '@testing-library/jest-dom';

import {
  clinicalKpiApiSlice,
  store,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { server } from './server';

beforeAll(() => {
  jest.useFakeTimers();
  server.listen();
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  server.resetHandlers();
  store.dispatch(clinicalKpiApiSlice.util.resetApiState());
});
