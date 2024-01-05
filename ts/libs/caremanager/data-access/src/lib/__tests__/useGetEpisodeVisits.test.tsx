import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useGetEpisodeVisits } from '../useGetEpisodeVisits';
import { server } from '../../test/mockServer';
import { GetEpisodeVisitsResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useGetEpisodeVisits', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useGetEpisodeVisits({ episodeId: '1' }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('should return fetched visits', async () => {
    const { result } = setupHook();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      GetEpisodeVisitsResponseFromJSON(JSONMocks.episodeVisits)
    );
  });
});
