import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useGetEpisode } from '../useGetEpisode';
import { GetEpisodeResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';

const setup = (id: string) => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetEpisode(id), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetEpisode', () => {
  it('should return the queried episode', async () => {
    const { result } = setup('1');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      GetEpisodeResponseFromJSON(JSONMocks.episode)
    );
  });
});
