import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useGetUser } from '../useGetUser';
import { userKeys } from '../userKeys';

describe('useGetUser', () => {
  it('should return the queried user', async () => {
    const testQueryClient = createTestQueryClient();
    testQueryClient.setQueryData(userKeys.detail('1'), 'someuserdata');

    const { result } = renderHook(() => useGetUser('1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toBe('someuserdata');
  });
});
