import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useGetVisitTypes } from '../useGetVisitTypes';
import { server } from '../../test/mockServer';
import { GetVisitTypesResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useGetVisitTypes', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useGetVisitTypes(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('should return fetched visit types', async () => {
    const { result } = setupHook();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      GetVisitTypesResponseFromJSON(JSONMocks.visitTypes)
    );
  });
});
