import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { getUnixTime } from 'date-fns';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { CanScheduleVisitResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useCanScheduleVisit } from '../useCanScheduleVisit';
import { server } from '../../test/mockServer';

describe('useCanScheduleVisit', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useCanScheduleVisit(), {
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
        body: {
          careRequestId: '1',
          patientAvailabilityStartTime: `${getUnixTime(new Date())}`,
          patientAvailabilityEndTime: `${getUnixTime(new Date())}`,
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      CanScheduleVisitResponseFromJSON(JSONMocks.canScheduleVisit)
    );
  });
});
