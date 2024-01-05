import { QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useUpdatePatient } from '../useUpdatePatient';
import {
  CareManagerServiceUpdatePatientRequest,
  UpdatePatientResponseFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';

const setupHook = () => {
  const testQueryClient = createTestQueryClient();

  return renderHook(() => useUpdatePatient(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </QueryClientProvider>
    ),
  });
};

describe('useUpdatePatient', () => {
  it('updates an existing patient', async () => {
    const { result } = setupHook();
    const bodyMock: CareManagerServiceUpdatePatientRequest = {
      firstName: 'new test name',
      lastName: 'new last name',
      dateOfBirth: 'yesterday',
      sex: 'test',
    };

    act(() => {
      result.current.mutate({
        patientId: '1',
        body: bodyMock,
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      UpdatePatientResponseFromJSON({
        patient: {
          ...JSONMocks.createdPatient,
          first_name: bodyMock.firstName,
          last_name: bodyMock.lastName,
          date_of_birth: bodyMock.dateOfBirth,
          sex: bodyMock.sex,
        },
      })
    );
  });
});
