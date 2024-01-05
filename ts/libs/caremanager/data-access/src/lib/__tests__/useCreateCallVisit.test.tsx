import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useCreateCallVisit } from '../useCreateCallVisit';
import { server } from '../../test/mockServer';
import { CreateCallVisitResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { SnackbarProvider } from 'notistack';

describe('useCreateCallVisit', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useCreateCallVisit(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryClientProvider>
      ),
    });

  it('creates a new CallVisit', async () => {
    const { result } = setupHook();
    const summaryMock = 'the best summary';
    const visitTypeIDMock = '1';

    act(() => {
      result.current.mutate({
        body: {
          episodeId: '1',
          visitTypeId: visitTypeIDMock,
          summary: summaryMock,
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      CreateCallVisitResponseFromJSON({
        visit: { ...JSONMocks.visit.visit, type_id: visitTypeIDMock },
        summary: { ...JSONMocks.visitSummary.summary, body: summaryMock },
      })
    );
  });
});
