import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useUpdateVisitSummary } from '../useUpdateVisitSummary';
import { server } from '../../test/mockServer';
import { UpdateVisitSummaryResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useUpdateVisitSummary', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useUpdateVisitSummary(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('edits a visit summary', async () => {
    const editedSummaryBody = 'edited summary';
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        visitId: '1',
        body: {
          body: editedSummaryBody,
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      UpdateVisitSummaryResponseFromJSON({
        summary: {
          ...JSONMocks.visitSummary.summary,
          body: editedSummaryBody,
        },
      })
    );
  });
});
