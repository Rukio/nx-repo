import { setupTestStore } from '../../../testUtils';
import {
  buildCachePath,
  mockPatientAccount,
  patientAccountsSlice,
  PATIENT_ACCOUNTS_API_PATH,
  buildAccountPatientPath,
  mockUpdateAccountPatientPayload,
  buildPatientAccountPatientsPath,
  mockAccountPatients,
  mockPatient,
} from '../../domain';
import {
  manageConsentInitialState,
  manageConsentSlice,
  selectManageConsentLoadingState,
  cachePatientPOA,
} from './manageConsent.slice';
import { AccountPatient } from '@*company-data-covered*/consumer-web-types';
import { mockCachePatientPOAPayload } from './mocks';

const MOCKED_ACCOUNT_PATIENT: AccountPatient = mockAccountPatients[0];

const MOCKED_ACCOUNT_PATIENT_WITHOUT_POA: AccountPatient = {
  ...mockAccountPatients[0],
  patient: {
    ...MOCKED_ACCOUNT_PATIENT.patient,
    powerOfAttorney: {},
  },
};

describe('manageConsent.slice', () => {
  it('should initialize default reducer state', () => {
    const state = manageConsentSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(manageConsentInitialState);
  });

  describe('reducers', () => {
    it('cachePatientPOA should update the state on pending status', async () => {
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

      const initialLoadingState = selectManageConsentLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageConsentInitialState.isLoading,
        isError: manageConsentInitialState.isError,
        isSuccess: manageConsentInitialState.isSuccess,
      });

      store.dispatch(cachePatientPOA(mockCachePatientPOAPayload));

      const pendingLoadingState = selectManageConsentLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('cachePatientPOA should update the state on fulfilled status ', async () => {
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
        new RegExp(buildCachePath()),
        JSON.stringify({ success: true })
      );

      const { store } = setupTestStore();

      await store.dispatch(
        patientAccountsSlice.endpoints.getAccount.initiate()
      );

      const initialLoadingState = selectManageConsentLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageConsentInitialState.isLoading,
        isError: manageConsentInitialState.isError,
        isSuccess: manageConsentInitialState.isSuccess,
      });

      await store.dispatch(cachePatientPOA(mockCachePatientPOAPayload));
      const fulfilledLoadingState = selectManageConsentLoadingState(
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
    describe('cachePatientPOA', () => {
      it('should return falsy isError if successfully updated patient POA ', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: MOCKED_ACCOUNT_PATIENT,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: mockAccountPatients })
        );

        fetchMock.mockResponse(
          JSON.stringify({
            data: MOCKED_ACCOUNT_PATIENT,
          })
        );

        const { store } = setupTestStore({
          manageSelfSchedule: { data: { patientId: mockPatientAccount.id } },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate({
            id: mockUpdateAccountPatientPayload.accountId,
          })
        );

        const data = await store
          .dispatch(cachePatientPOA(mockCachePatientPOAPayload))
          .unwrap();

        expect(data).toEqual({ isError: false });
      });

      it('should return truthy isError if update of patient POA failed', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: MOCKED_ACCOUNT_PATIENT,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: mockAccountPatients })
        );

        fetchMock.mockOnceIf(
          new RegExp(
            buildAccountPatientPath(mockPatientAccount.id, mockPatient.id)
          ),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockRejectOnce();

        const { store } = setupTestStore({
          manageSelfSchedule: { data: { patientId: mockPatientAccount.id } },
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
          .dispatch(cachePatientPOA(mockCachePatientPOAPayload))
          .unwrap();

        expect(data).toEqual({ isError: true });
      });

      it('should return falsy isError if successfully updated cache POA ', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: MOCKED_ACCOUNT_PATIENT,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: [MOCKED_ACCOUNT_PATIENT_WITHOUT_POA] })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ success: true })
        );

        const { store } = setupTestStore({
          manageSelfSchedule: { data: { patientId: mockPatientAccount.id } },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate({
            id: mockUpdateAccountPatientPayload.accountId,
          })
        );

        const data = await store
          .dispatch(cachePatientPOA(mockCachePatientPOAPayload))
          .unwrap();

        expect(data).toEqual({ isError: false });
      });

      it('should return truthy isError if cache POA updated failed', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({
            data: MOCKED_ACCOUNT_PATIENT,
          })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: [MOCKED_ACCOUNT_PATIENT_WITHOUT_POA] })
        );

        fetchMock.mockOnceIf(
          new RegExp(
            buildAccountPatientPath(mockPatientAccount.id, mockPatient.id)
          ),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockRejectOnce();

        const { store } = setupTestStore({
          manageSelfSchedule: { data: { patientId: mockPatientAccount.id } },
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
          .dispatch(cachePatientPOA(mockCachePatientPOAPayload))
          .unwrap();

        expect(data).toEqual({ isError: true });
      });
    });
  });
});
