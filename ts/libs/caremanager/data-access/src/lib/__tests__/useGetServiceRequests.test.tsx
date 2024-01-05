import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useGetServiceRequests } from '../useGetServiceRequests';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { GetServiceRequestsResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetServiceRequests(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetServiceRequests', () => {
  it('should return the list of service requests', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      GetServiceRequestsResponseFromJSON(JSONMocks.serviceRequests)
    );
  });
});
