import { setupTestStore } from '../../../testUtils';
import {
  buildAddUnverifiedAccountPatientLinkPath,
  buildCachePath,
  buildPatientAccountPatientsPath,
  buildPatientAccountPath,
  mockAccountPatients,
  mockGetAccountPatientsQuery,
  mockPatientAccount,
  mockPatientAccountPatientLink,
  mockSelfScheduleData,
  patientAccountsSlice,
  PATIENT_ACCOUNTS_API_PATH,
  buildCreatePatientEhrRecordPath,
  mockGetPatientQuery,
  mockPatient,
  mockUpdateAccountPatientPayload,
  buildAccountPatientPath,
} from '../../domain';
import { PatientAccountPatient, RelationToPatient } from '../../types';
import {
  managePatientDemographicsInitialState,
  managePatientDemographicsSlice,
  selectIsPatientDismissed,
  selectManagePatientDemographicsLoadingState,
  selectUnverifiedPatient,
  selectVerifiedPatient,
  updatePatientDemographics,
  upsertPatient,
} from './managePatientDemographics.slice';
import {
  mockUpdatePatientDemographicsPayload,
  mockUpsertPatientPayload,
} from './mocks';

describe('managePatientDemographics.slice', () => {
  it('should initialize default reducer state', () => {
    const state = managePatientDemographicsSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(managePatientDemographicsInitialState);
  });

  describe('reducers', () => {
    it('updatePatientDemographics should update the state on pending status', async () => {
      fetchMock.mockOnceIf(
        new RegExp(
          buildAddUnverifiedAccountPatientLinkPath(mockPatientAccount.id)
        ),
        JSON.stringify({
          data: mockPatientAccountPatientLink,
        })
      );

      fetchMock.mockOnceIf(
        new RegExp(buildPatientAccountPath(mockPatientAccount.id)),
        JSON.stringify({
          data: mockPatientAccount,
        })
      );

      fetchMock.mockOnceIf(
        new RegExp(buildCachePath()),
        JSON.stringify({ success: true })
      );

      fetchMock.mockOnceIf(
        new RegExp(PATIENT_ACCOUNTS_API_PATH),
        JSON.stringify({
          data: mockPatientAccount,
        })
      );

      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );

      const initialLoadingState = selectManagePatientDemographicsLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientDemographicsInitialState.isLoading,
        isError: managePatientDemographicsInitialState.isError,
        isSuccess: managePatientDemographicsInitialState.isSuccess,
        error: managePatientDemographicsInitialState.error,
      });

      store.dispatch(
        updatePatientDemographics(mockUpdatePatientDemographicsPayload)
      );

      const pendingLoadingState = selectManagePatientDemographicsLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('updatePatientDemographics should update the state on fulfilled status', async () => {
      fetchMock.mockOnceIf(
        new RegExp(
          buildAddUnverifiedAccountPatientLinkPath(mockPatientAccount.id)
        ),
        JSON.stringify({
          data: mockPatientAccountPatientLink,
        })
      );

      fetchMock.mockOnceIf(
        new RegExp(buildPatientAccountPath(mockPatientAccount.id)),
        JSON.stringify({
          data: mockPatientAccount,
        })
      );

      fetchMock.mockOnceIf(
        new RegExp(buildCachePath()),
        JSON.stringify({ success: true })
      );

      fetchMock.mockOnceIf(
        new RegExp(PATIENT_ACCOUNTS_API_PATH),
        JSON.stringify({
          data: mockPatientAccount,
        })
      );

      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );

      const initialLoadingState = selectManagePatientDemographicsLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePatientDemographicsInitialState.isLoading,
        isError: managePatientDemographicsInitialState.isError,
        isSuccess: managePatientDemographicsInitialState.isSuccess,
        error: managePatientDemographicsInitialState.error,
      });

      await store.dispatch(
        updatePatientDemographics(mockUpdatePatientDemographicsPayload)
      );
      const fulfilledLoadingState = selectManagePatientDemographicsLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });
  });

  describe('thunks', () => {
    describe('updatePatientDemographics', () => {
      it('should return falsy isError for non-self relationship', async () => {
        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ success: true })
        );

        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        const data = await store
          .dispatch(
            updatePatientDemographics(mockUpdatePatientDemographicsPayload)
          )
          .unwrap();

        expect(data).toEqual({ isError: false });
      });

      it('should return falsy isError if self relationship', async () => {
        const { store } = setupTestStore({
          manageSelfSchedule: {
            data: {
              requester: {
                ...mockSelfScheduleData.requester,
                relationToPatient: RelationToPatient.Patient,
              },
            },
          },
        });

        const data = await store
          .dispatch(
            updatePatientDemographics(mockUpdatePatientDemographicsPayload)
          )
          .unwrap();
        expect(data).toEqual({ isError: false });
      });

      it('should return truthy isError for non-self relationship', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockRejectedValue('Invalid syntax');

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        const data = await store
          .dispatch(
            updatePatientDemographics(mockUpdatePatientDemographicsPayload)
          )
          .unwrap();

        expect(data).toEqual(
          expect.objectContaining({
            isError: true,
          })
        );
      });
    });

    describe('upsertPatient', () => {
      it('should return falsy isError for non-self relationship', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockAccountPatients,
          })
        );

        fetchMock.mockResponse(
          JSON.stringify({
            data: mockPatient,
          })
        );

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const data = await store
          .dispatch(upsertPatient(mockUpsertPatientPayload))
          .unwrap();

        expect(data).toEqual({ isError: false });
      });

      it('should return falsy isError if no patient', async () => {
        const { store } = setupTestStore();

        const data = await store
          .dispatch(
            updatePatientDemographics(mockUpdatePatientDemographicsPayload)
          )
          .unwrap();
        expect(data).toEqual({ isError: false });
      });

      it('should return truthy isError if createPatientEhrRecord failed with error', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockRejectedValue('Invalid syntax');

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        const data = await store
          .dispatch(
            updatePatientDemographics(mockUpdatePatientDemographicsPayload)
          )
          .unwrap();

        expect(data).toEqual(
          expect.objectContaining({
            isError: true,
          })
        );
      });

      it('should return falsy isError if updateAccountPatient were successful', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockAccountPatients,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCreatePatientEhrRecordPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockPatient,
          })
        );

        fetchMock.mockResponse(JSON.stringify({ data: { ...mockPatient } }));

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });
        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const data = await store
          .dispatch(upsertPatient(mockUpsertPatientPayload))
          .unwrap();

        expect(data).toEqual(
          expect.objectContaining({
            isError: false,
          })
        );
      });

      it('should return truthy isError if updateAccountPatient failed with error', async () => {
        const mockPatientAccountsWithoutDHPatientId: PatientAccountPatient[] = [
          {
            ...mockAccountPatients[0],
            unverifiedPatient: {
              ...mockAccountPatients[0].unverifiedPatient,
              patientId: undefined,
            },
          },
        ];

        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockPatientAccountsWithoutDHPatientId,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(
            buildAccountPatientPath(
              mockUpdateAccountPatientPayload.accountId,
              mockUpdateAccountPatientPayload.patientId
            )
          ),
          JSON.stringify({
            data: mockAccountPatients[0],
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCreatePatientEhrRecordPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockPatient,
          })
        );

        fetchMock.mockRejectedValue('updateAccountPatient error');

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });
        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const data = await store
          .dispatch(upsertPatient(mockUpsertPatientPayload))
          .unwrap();

        expect(data).toEqual(
          expect.objectContaining({
            isError: true,
          })
        );
      });

      it('should return falsy isError if updateAccountPatient were successful for existing patient', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockAccountPatients,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(
            buildAccountPatientPath(mockPatientAccount.id, mockPatient.id)
          ),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockResponse(JSON.stringify({ data: { ...mockPatient } }));

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });
        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatient.initiate({
            accountId: mockPatientAccount.id,
            patientId: mockPatient.id,
          })
        );

        const data = await store
          .dispatch(upsertPatient(mockUpsertPatientPayload))
          .unwrap();

        expect(data).toEqual(
          expect.objectContaining({
            isError: false,
          })
        );
      });

      it('should return truthy isError if updateAccountPatient failed with error for existing patient', async () => {
        const errorMessage = 'updateAccountPatient error';

        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({
            data: mockAccountPatients,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(
            buildAccountPatientPath(mockPatientAccount.id, mockPatient.id)
          ),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockRejectedValue(errorMessage);

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate({
            id: mockUpdateAccountPatientPayload.accountId,
          })
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatient.initiate({
            accountId: mockPatientAccount.id,
            patientId: mockPatient.id,
          })
        );

        const data = await store
          .dispatch(upsertPatient(mockUpsertPatientPayload))
          .unwrap();

        expect(data).toEqual(
          expect.objectContaining({
            isError: true,
          })
        );
      });
    });
  });

  describe('selectors', () => {
    describe('selectVerifiedPatient', () => {
      it('should select correct patient', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockResponse(JSON.stringify({ data: mockAccountPatients }));

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const result = selectVerifiedPatient()(store.getState());
        expect(result).toEqual(mockAccountPatients[0].patient);
      });

      it('should return null if patientId is not same', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockAccountPatients }));

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const result = selectVerifiedPatient()(store.getState());
        expect(result).toBeNull();
      });

      it('should return null if account patients list is empty', async () => {
        const { store } = setupTestStore();

        const result = selectVerifiedPatient()(store.getState());
        expect(result).toBeNull();
      });
    });

    describe('selectUnverifiedPatient', () => {
      it('should select correct patient', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: mockPatientAccount,
          })
        );

        fetchMock.mockResponse(JSON.stringify({ data: mockAccountPatients }));

        const { store } = setupTestStore({
          manageSelfSchedule: { data: mockSelfScheduleData },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const result = selectUnverifiedPatient()(store.getState());
        expect(result).toEqual(mockAccountPatients[0].unverifiedPatient);
      });

      it('should return null if patientId is not same', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockAccountPatients }));

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate(
            mockGetAccountPatientsQuery
          )
        );

        const result = selectUnverifiedPatient()(store.getState());
        expect(result).toBeNull();
      });

      it('should return null if account patients list is empty', async () => {
        const { store } = setupTestStore();

        const result = selectUnverifiedPatient()(store.getState());
        expect(result).toBeNull();
      });
    });

    describe('selectIsPatientDismissed', () => {
      it('should select correct patient', async () => {
        fetchMock.mockResponse(
          JSON.stringify({
            data: mockPatient,
          })
        );

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatient.initiate(
            mockGetPatientQuery
          )
        );

        const result = selectIsPatientDismissed(mockGetPatientQuery)(
          store.getState()
        );
        expect(result).toEqual(
          !!mockAccountPatients[0].patient.patientSafetyFlag
        );
      });
    });
  });
});
