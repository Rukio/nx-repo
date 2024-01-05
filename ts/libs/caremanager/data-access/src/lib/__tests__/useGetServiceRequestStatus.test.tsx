import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useGetServiceRequestStatus } from '../useGetServiceRequestStatus';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  GetServiceRequestStatusResponseFromJSON,
  ServiceRequestStatus,
} from '@*company-data-covered*/caremanager/data-access-types';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetServiceRequestStatus(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetServiceRequestStatus', () => {
  it('should return the list of service requests status', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe('success'));

    const responseMock = GetServiceRequestStatusResponseFromJSON(
      JSONMocks.serviceRequestStatus
    );

    const statusMap: Record<string, ServiceRequestStatus> = {};
    responseMock.serviceRequestStatus.forEach((v) => (statusMap[v.slug] = v));

    expect(result.current.data).toEqual({
      statusMap,
      list: responseMock.serviceRequestStatus,
    });
  });
});
