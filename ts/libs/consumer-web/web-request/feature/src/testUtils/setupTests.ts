import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import { dayjsSetup } from '../lib/utils/dayjsSetup';
import { mswServer } from './server';

dayjsSetup();

beforeAll(() => {
  mswServer.listen();
});

afterEach(() => {
  mswServer.restoreHandlers();
});

afterAll(() => {
  mswServer.close();
});
