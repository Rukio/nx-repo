import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  CareManagerServiceGetVisitAvailabilityRequest,
  GetVisitAvailabilityResponseFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useGetVisitAvailability } from '../useGetVisitAvailability';
import { server } from '../../test/mockServer';

describe('useGetVisitAvailability', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = (input: CareManagerServiceGetVisitAvailabilityRequest) =>
    renderHook(() => useGetVisitAvailability(input), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('works', async () => {
    const input: CareManagerServiceGetVisitAvailabilityRequest = {
      body: {
        careRequestId: '1',
        requestedDates: ['2023-07-10'],
      },
    };

    const { result } = setupHook(input);

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      GetVisitAvailabilityResponseFromJSON(JSONMocks.visitAvailability)
    );
  });
});
