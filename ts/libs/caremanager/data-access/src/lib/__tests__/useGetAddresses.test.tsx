import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useGetAddresses } from '../useGetAddresses';
import { server } from '../../test/mockServer';
import { GetAddressesByIDResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useGetAddresses', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useGetAddresses(['1']), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('should return fetched addresses', async () => {
    const { result } = setupHook();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      GetAddressesByIDResponseFromJSON(JSONMocks.addresses)
    );
  });
});
