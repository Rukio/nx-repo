import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useCreatePharmacy } from '../useCreatePharmacy';
import { server } from '../../test/mockServer';
import { CreatePharmacyResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useCreatePharmacy', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useCreatePharmacy(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryClientProvider>
      ),
    });

  it('creates a new Pharmacy', async () => {
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        body: {
          patientId: '1',
          phoneNumber: '+11234567890',
          name: 'Farmacias Guadalajara',
          faxNumber: '+11234567890',
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      CreatePharmacyResponseFromJSON({
        pharmacy: JSONMocks.pharmacy,
        patient_pharmacies: [JSONMocks.pharmacy, JSONMocks.pharmacy],
      })
    );
  });
});
