import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import { mswServer } from './server';

beforeAll(() => {
  jest.useFakeTimers();
  mswServer.listen();
});

afterEach(() => {
  mswServer.restoreHandlers();
});

afterAll(() => {
  mswServer.close();
});
