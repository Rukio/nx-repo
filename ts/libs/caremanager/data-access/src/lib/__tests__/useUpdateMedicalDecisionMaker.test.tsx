import { QueryClientProvider } from 'react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { useUpdateMedicalDecisionMaker } from '../useUpdateMedicalDecisionMaker';
import { UpdateMedicalDecisionMakerResponseFromJSON } from '@*company-data-covered*/caremanager/data-access-types';

describe('useUpdateMedicalDecisionMaker', () => {
  const testQueryClient = createTestQueryClient();
  const setupHook = () =>
    renderHook(() => useUpdateMedicalDecisionMaker(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

  it('updates an existing MedicalDecisionMaker', async () => {
    const { result } = setupHook();

    act(() => {
      result.current.mutate({
        medicalDecisionMakerId: JSONMocks.medicalDecisionMaker.id,
        body: {
          firstName: 'Jane',
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(
      UpdateMedicalDecisionMakerResponseFromJSON({
        medical_decision_maker: {
          ...JSONMocks.medicalDecisionMaker,
          first_name: 'Jane',
        },
        patient_medical_decision_makers: [
          {
            ...JSONMocks.medicalDecisionMaker,
            first_name: 'Jane',
          },
        ],
      })
    );
  });
});
