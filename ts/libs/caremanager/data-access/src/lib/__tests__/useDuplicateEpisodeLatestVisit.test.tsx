import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { DuplicateEpisodeLatestVisitResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useDuplicateEpisodeLatestVisit } from '../useDuplicateEpisodeLatestVisit';
import { server } from '../../test/mockServer';

describe('useDuplicateEpisodeLatestVisit', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useDuplicateEpisodeLatestVisit(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('works', async () => {
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        body: {},
        episodeId: '1',
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      DuplicateEpisodeLatestVisitResponseFromJSON(
        JSONMocks.duplicateEpisodeLatestVisit
      )
    );
  });
});
