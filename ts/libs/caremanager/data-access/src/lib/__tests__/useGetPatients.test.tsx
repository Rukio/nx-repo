import { QueryClientProvider } from 'react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useGetPatients } from '../useGetPatients';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { GetPatientsResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useGetPatients('lopez'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
};

describe('useGetPatients', () => {
  it('should return the list of patients', async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.data).toEqual(
      GetPatientsResponseFromJSON(JSONMocks.patients)
    );
  });
});
