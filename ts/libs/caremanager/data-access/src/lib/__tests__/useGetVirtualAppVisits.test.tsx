import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { GetVirtualAPPVisitsQueueResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useGetVirtualAppVisits } from '../useGetVirtualAppVisits';

describe('useGetVirtualAppVisits', () => {
  const testQueryClient = createTestQueryClient();

  const setup = () => {
    return renderHook(
      () =>
        useGetVirtualAppVisits({
          shiftTeamId: '4455667',
          marketIds: ['198'],
          userId: '1234567',
        }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={testQueryClient}>
            {children}
          </QueryClientProvider>
        ),
      }
    );
  };

  it('should return virtual app visits', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      GetVirtualAPPVisitsQueueResponseFromJSON({
        ...JSONMocks.virtualAppVisits,
      })
    );
  });
});
