import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useUpdateVisit } from '../useUpdateVisit';
import { server } from '../../test/mockServer';
import { GetVisitResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useGetVisit', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useUpdateVisit(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('should return fetched visit', async () => {
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        visitId: '1',
        body: {},
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      GetVisitResponseFromJSON({ visit: JSONMocks.visit.visit })
    );
  });
});
