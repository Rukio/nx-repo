import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useCreateMedicalDecisionMaker } from '../useCreateMedicalDecisionMaker';
import { server } from '../../test/mockServer';
import { CreateMedicalDecisionMakerResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useCreateMedicalDecisionMaker', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useCreateMedicalDecisionMaker(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('creates a new MedicalDecisionMaker', async () => {
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        body: {
          patientId: '1',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+523345454545',
          relationship: 'Parent',
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      CreateMedicalDecisionMakerResponseFromJSON({
        medical_decision_maker: JSONMocks.medicalDecisionMaker,
        patient_medical_decision_makers: [JSONMocks.medicalDecisionMaker],
      })
    );
  });
});
