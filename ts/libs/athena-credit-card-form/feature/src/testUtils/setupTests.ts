import '@testing-library/jest-dom';
import matchers from '@testing-library/jest-dom/matchers';
import { mswServer } from './server';

expect.extend(matchers);

beforeAll(() => {
  mswServer.listen();
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});
