import { QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useUpdateServiceRequest } from '../useUpdateServiceRequest';
import { UpdateServiceRequestResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

const setupHook = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useUpdateServiceRequest(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </QueryClientProvider>
    ),
  });
};

describe('useUpdateServiceRequest', () => {
  it('should update a service request', async () => {
    const { result } = setupHook();

    const serviceRequest = JSONMocks.serviceRequests.service_requests[0];
    const transformedServiceRequest =
      UpdateServiceRequestResponseFromJSON(serviceRequest);

    const body = {
      statusId: '3',
      isInsuranceVerified: true,
      assignedUserId: '2',
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
