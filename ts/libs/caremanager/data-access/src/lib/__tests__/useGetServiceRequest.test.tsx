import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { useGetServiceRequest } from '../useGetServiceRequest';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetServiceRequest('1'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetServiceRequest', () => {
  it('should return the fetched service request and its dependencies', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data?.serviceRequest?.id).toBe('1');
    expect(result.current.data?.stationPatient?.id).toBe('77853');
    expect(result.current.data?.stationCareRequest?.id).toBe('819283');
  });
});
