import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useGetPatient } from '../useGetPatient';

describe('useGetPatient', () => {
  const testQueryClient = createTestQueryClient();
  const setupHook = () => {
    return renderHook(() => useGetPatient('1234'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });
  };

  it('should return the fetched patient', async () => {
    const { result } = setupHook();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data?.patient?.id).toBe('1');
    expect(result.current.data?.insurances).toHaveLength(1);
    expect(result.current.data?.medicalDecisionMakers).toHaveLength(1);
    expect(result.current.data?.pharmacies).toHaveLength(1);
    expect(result.current.data?.externalCareProviders).toHaveLength(1);
  });
});
