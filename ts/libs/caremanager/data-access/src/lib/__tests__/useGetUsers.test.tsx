import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { QueryClientProvider } from 'react-query';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useGetUsers } from '../useGetUsers';
import { server } from '../../test/mockServer';

describe('useGetUsers', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () => {
    return renderHook(() => useGetUsers(['1']), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });
  };

  it('should return fetched users', async () => {
    const { result } = setupHook();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data?.users).toHaveLength(1);
  });

  it('should return an empty array if the request fails', async () => {
    server.use(
      rest.get('/v1/users/by-id', (_, res) =>
        res.networkError('Failed to connect')
      )
    );
    const { result } = renderHook(() => useGetUsers(['1232']), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.data?.users).toHaveLength(0);
    });
  });
});
