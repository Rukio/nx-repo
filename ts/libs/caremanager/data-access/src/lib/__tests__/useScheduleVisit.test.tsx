import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { getUnixTime } from 'date-fns';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useScheduleVisit } from '../useScheduleVisit';
import { server } from '../../test/mockServer';

describe('useScheduleVisit', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = (careRequestId: string) =>
    renderHook(() => useScheduleVisit(careRequestId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('works', async () => {
    const careRequestId = '1';

    const { result } = setupHook(careRequestId);

    act(() => {
      result.current.mutate({
        body: {
          careRequestId: '1',
          patientAvailabilityStartTime: `${getUnixTime(new Date())}`,
          patientAvailabilityEndTime: `${getUnixTime(new Date())}`,
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({});
  });
});
