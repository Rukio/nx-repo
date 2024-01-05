import { QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { RejectServiceRequestResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';
import { useRejectServiceRequest } from '../useRejectServiceRequest';

const setupHook = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useRejectServiceRequest(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </QueryClientProvider>
    ),
  });
};

describe('useRejectServiceRequest', () => {
  it('should reject a service request', async () => {
    const { result } = setupHook();

    const serviceRequest = JSONMocks.serviceRequests.service_requests[0];
    const transformedServiceRequest =
      RejectServiceRequestResponseFromJSON(serviceRequest);

    const body = {
      rejectReason: 'Insurance invalid',
    };

    act(() => {
      result.current.mutate({
        serviceRequestId: '1',
        body,
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({
      serviceRequest: {
        ...transformedServiceRequest.serviceRequest,
        ...body,
      },
    });
  });
});
