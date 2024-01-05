import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  CareManagerServiceGetEpisodesRequest,
  GetEpisodesResponseFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useGetEpisodes } from '../useGetEpisodes';

const setup = (input: CareManagerServiceGetEpisodesRequest) => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetEpisodes(input), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetEpisodes', () => {
  it('should return the episode list page 1', async () => {
    const { result } = setup({ page: '1' });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      GetEpisodesResponseFromJSON(JSONMocks.episodesPage1)
    );
  });
});
