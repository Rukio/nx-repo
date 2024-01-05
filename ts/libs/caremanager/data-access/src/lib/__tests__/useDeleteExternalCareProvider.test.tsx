import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { useDeleteExternalCareProvider } from '../useDeleteExternalCareProvider';
import { server } from '../../test/mockServer';
import { DeleteExternalCareProviderResponse } from '@*company-data-covered*/caremanager/data-access-types';

describe('useDeleteExternalCareProvider', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useDeleteExternalCareProvider('1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('deletes an existing ExternalCareProvider', async () => {
    const { result } = setupHook();

    await act(async () => {
      await result.current.mutateAsync({
        externalCareProviderId: '1',
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual<DeleteExternalCareProviderResponse>({
      patientExternalCareProviders: [],
    });
  });
});
