import 'vitest-fetch-mock';
import '@testing-library/jest-dom';
import matchers from '@testing-library/jest-dom/matchers';
import createFetchMock from 'vitest-fetch-mock';
import { vi } from 'vitest';

expect.extend(matchers);

const fetchMocker = createFetchMock(vi);

// sets globalThis.fetch and globalThis.fetchMock to our mocked version
fetchMocker.enableMocks();
