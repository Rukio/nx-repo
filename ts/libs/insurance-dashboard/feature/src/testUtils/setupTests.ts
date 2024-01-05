import '@*company-data-covered*/shared/testing/react/setup';
import { mswServer } from './server';

beforeAll(() => {
  mswServer.listen();
});

afterEach(() => {
  mswServer.restoreHandlers();
});

afterAll(() => {
  mswServer.close();
});
