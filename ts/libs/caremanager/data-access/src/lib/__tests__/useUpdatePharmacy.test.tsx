import { QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useUpdatePharmacy } from '../useUpdatePharmacy';
import { server } from '../../test/mockServer';
import { UpdatePharmacyResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useUpdatePharmacy', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useUpdatePharmacy(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryClientProvider>
      ),
    });

  it('updates an existing pharmacy', async () => {
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        pharmacyId: '1',
        body: {
          phoneNumber: '999-999-999',
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      UpdatePharmacyResponseFromJSON({
        pharmacy: {
          ...JSONMocks.pharmacy,
          phone_number: '999-999-999',
        },
        patient_pharmacies: [
          { ...JSONMocks.pharmacy, phone_number: '999-999-999' },
        ],
      })
    );
  });
});
