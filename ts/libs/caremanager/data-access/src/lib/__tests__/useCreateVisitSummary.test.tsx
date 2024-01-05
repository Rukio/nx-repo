import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useCreateVisitSummary } from '../useCreateVisitSummary';
import { server } from '../../test/mockServer';
import { CreateVisitSummaryResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useCreateVisitSummary', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useCreateVisitSummary(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('returns a new summary', async () => {
    const newSummaryBody = 'new summary';
    const { result } = setupHook();

    await act(async () => {
      await result.current.mutateAsync({
        visitId: '1',
        body: {
          body: newSummaryBody,
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      CreateVisitSummaryResponseFromJSON({
        summary: {
          ...JSONMocks.visitSummary.summary,
          body: newSummaryBody,
        },
      })
    );
  });
});
