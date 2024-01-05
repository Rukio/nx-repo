import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  CreateExternalCareProviderRequest,
  CreateExternalCareProviderResponseFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { useCreateExternalCareProvider } from '../useCreateExternalCareProvider';

const setup = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useCreateExternalCareProvider(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </QueryClientProvider>
    ),
  });
};

describe('useCreateExternalCareProvider', () => {
  it('creates a new external care provider', async () => {
    const { result } = setup();
    const newECPMock: CreateExternalCareProviderRequest = {
      patientId: '7234',
      name: 'test name',
      providerTypeId: '876',
    };

    act(() => {
      result.current.mutate({
        body: newECPMock,
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    const expectedECP = {
      ...JSONMocks.externalCareProvider,
      patient_id: newECPMock.patientId,
      name: newECPMock.name,
      provider_type_id: newECPMock.providerTypeId,
    };
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      CreateExternalCareProviderResponseFromJSON({
        external_care_provider: expectedECP,
        patient_external_care_providers: [
          JSONMocks.externalCareProvider,
          expectedECP,
        ],
      })
    );
  });
});
