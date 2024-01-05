import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'vitest-fetch-mock';
import createFetchMock from 'vitest-fetch-mock';
import matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const fetchMocker = createFetchMock(vi);

// sets globalThis.fetch and globalThis.fetchMock to our mocked version
fetchMocker.enableMocks();

beforeAll(() => {
  fetchMock.enableMocks();
});

beforeEach(() => {
  fetchMock.resetMocks();
});
