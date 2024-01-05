import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { useUnassignOwnerFromServiceRequest } from '../useUnassignOwnerFromServiceRequest';
import { UnassignOwnerFromServiceRequestResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useUnassignOwnerFromServiceRequest('1'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useUnassignOwnerFromServiceRequest', () => {
  beforeAll(() => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00.000Z'));
  });

  it('should return the updated service request', async () => {
    const { result } = setup();

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    const serviceRequestResponseMock =
      JSONMocks.serviceRequests.service_requests[0];
    expect(result.current.data).toEqual(
      UnassignOwnerFromServiceRequestResponseFromJSON({
        service_request: {
          ...serviceRequestResponseMock.service_request,
          assigned_user_id: undefined,
          updated_by_user_id: '1',
          updated_at: '2024-08-01T00:00:00.000Z',
        },
      })
    );
  });
});
