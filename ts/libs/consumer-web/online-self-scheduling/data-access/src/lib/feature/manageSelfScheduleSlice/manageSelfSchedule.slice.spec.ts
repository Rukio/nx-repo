import { authSlice, initialAuthState } from '@*company-data-covered*/auth0/data-access';
import { setupTestStore } from '../../../testUtils';
import {
  mockSelfScheduleData,
  selfScheduleSlice,
  mockCreateNotificationJobResponse,
  mockCheckMarketFeasibilityPayload,
  mockCheckMarketFeasibilityData,
  buildEtaRangesPath,
  buildCareRequestStatusPath,
  buildCareRequestPath,
  mockEtaRange,
  mockCareRequest,
  PATIENT_ACCOUNTS_API_PATH,
  mockPatientAccount,
  buildPatientAccountInsurancesPath,
  mockInsurance,
  buildMarketPath,
  mockMarket,
  mockGetPatientInsurancesQuery,
  patientAccountsSlice,
  marketsSlice,
  buildPatientAccountPatientsPath,
  mockAccountPatients,
  mockCreateCareRequestResponse,
  buildCheckMarketFeasibilityPath,
  buildAccountPatientPath,
  mockPatient,
  buildCachePath,
  buildNotificationsPath,
  mockPatientAccountPatientLink,
  mockPatientAccountUnverifiedPatient,
  mockInsuranceWithEligibleStatus,
} from '../../domain';
import {
  OffboardReason,
  PatchCareRequestStatusResponse,
  RelationToPatient,
} from '../../types';
import {
  mockPersistPartial,
  preLoginInitialState,
  preLoginSlice,
} from '../preLoginSlice';
import {
  manageSelfScheduleInitialState,
  manageSelfScheduleSlice,
  selectIsRequesterRelationshipSelf,
  selectManageSelfScheduleLoadingState,
  selectSelfScheduleData,
  updateCachedSelfScheduleData,
  updateSelfScheduleData,
  selectNotificationJobId,
  selectMarketFeasibilityLoadingData,
  selectMarketFeasibilityStatus,
  updateEtaRangesAndCareRequestStatus,
  selectOffboardReason,
  updateOffboardReason,
  selectIsRequesterRelationshipAcuityExcluded,
  selectIsAcuitySegmentationEnabled,
  createSelfSchedulingCareRequest,
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
} from './manageSelfSchedule.slice';
import { mockCreateSelfSchedulingCareRequestPayload } from './mocks';

const mockCareRequestId = 1;

describe('manageSelfScheduleSlice.slice', () => {
  it('should initialize default reducer state', () => {
    const state = manageSelfScheduleSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(manageSelfScheduleInitialState);
  });

  describe('reducers', () => {
    it('updateSelfScheduleData should update the state', () => {
      const { store } = setupTestStore();

      const initialSelfScheduleData = selectSelfScheduleData(store.getState());
      expect(initialSelfScheduleData).toEqual(
        manageSelfScheduleInitialState.data
      );

      store.dispatch(updateSelfScheduleData(mockSelfScheduleData));
      const updatedSelfScheduleData = selectSelfScheduleData(store.getState());
      expect(updatedSelfScheduleData).toEqual(mockSelfScheduleData);
    });

    it('cacheSelfScheduleData should update the state on pending status', () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ data: mockSelfScheduleData })
      );
      const { store } = setupTestStore();

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      store.dispatch(
        selfScheduleSlice.endpoints.cacheSelfScheduleData.initiate(
          mockSelfScheduleData
        )
      );
      const pendingLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('cacheSelfScheduleData should update the state on fulfilled status', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ data: mockSelfScheduleData })
      );
      const { store } = setupTestStore();

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      await store.dispatch(
        selfScheduleSlice.endpoints.cacheSelfScheduleData.initiate(
          mockSelfScheduleData
        )
      );
      const fulfilledLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('cacheSelfScheduleData should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValueOnce(mockedError);
      const { store } = setupTestStore();

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      await store.dispatch(
        selfScheduleSlice.endpoints.cacheSelfScheduleData.initiate(
          mockSelfScheduleData
        )
      );
      const rejectedLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('getCachedSelfScheduleData should update the data', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ data: mockSelfScheduleData })
      );
      const { store } = setupTestStore();

      const initialSelfScheduleData = selectSelfScheduleData(store.getState());
      expect(initialSelfScheduleData).toEqual(
        manageSelfScheduleInitialState.data
      );

      await store.dispatch(
        selfScheduleSlice.endpoints.getCachedSelfScheduleData.initiate()
      );
      const updatedSelfScheduleData = selectSelfScheduleData(store.getState());
      expect(updatedSelfScheduleData).toEqual(mockSelfScheduleData);
    });

    it('createNotificationJob should update the state on pending status', () => {
      fetchMock.mockResponseOnce(
        JSON.stringify(mockCreateNotificationJobResponse)
      );
      const { store } = setupTestStore();

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      store.dispatch(
        selfScheduleSlice.endpoints.createNotificationJob.initiate(
          mockCareRequestId
        )
      );
      const pendingLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('createNotificationJob should update the state on fulfilled status', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify(mockCreateNotificationJobResponse)
      );
      const { store } = setupTestStore();

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      await store.dispatch(
        selfScheduleSlice.endpoints.createNotificationJob.initiate(
          mockCareRequestId
        )
      );
      const fulfilledLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });

      const notificationJobId = selectNotificationJobId(store.getState());
      expect(notificationJobId).toEqual(
        mockCreateNotificationJobResponse.jobId
      );
    });

    it('createNotificationJob should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValueOnce(mockedError);
      const { store } = setupTestStore();

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      await store.dispatch(
        selfScheduleSlice.endpoints.createNotificationJob.initiate(
          mockCareRequestId
        )
      );
      const rejectedLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('updateEtaRangesAndCareRequestStatus should update the state on pending status', async () => {
      fetchMock.mockOnceIf(
        new RegExp(buildCareRequestPath()),
        JSON.stringify({ data: mockCareRequest })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildEtaRangesPath()),
        JSON.stringify({ data: mockEtaRange })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildCareRequestStatusPath()),
        JSON.stringify({ success: true })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getCareRequest.initiate()
      );

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      store.dispatch(
        updateEtaRangesAndCareRequestStatus({
          startsAt: 'startDate',
          endsAt: 'endDate',
          careRequestId: 1,
          careRequestStatusId: 1,
        })
      );
      const pendingLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('updateEtaRangesAndCareRequestStatus should update the state on fulfilled status', async () => {
      fetchMock.mockOnceIf(
        new RegExp(buildEtaRangesPath()),
        JSON.stringify({ data: mockEtaRange })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildCareRequestStatusPath()),
        JSON.stringify({ success: true })
      );
      fetchMock.mockIf(
        new RegExp(buildCareRequestPath()),
        JSON.stringify({ data: mockCareRequest })
      );
      const { store } = setupTestStore();

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      await store.dispatch(
        updateEtaRangesAndCareRequestStatus({
          startsAt: 'startDate',
          endsAt: 'endDate',
          careRequestId: 1,
          careRequestStatusId: 1,
        })
      );
      const fulfilledLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('updateEtaRangesAndCareRequestStatus should update the state on rejected status', async () => {
      fetchMock.mockIf(
        new RegExp(buildCareRequestPath()),
        JSON.stringify({ data: mockCareRequest })
      );
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValueOnce(mockedError);
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getCareRequest.initiate()
      );

      const initialLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageSelfScheduleInitialState.isLoading,
        isError: manageSelfScheduleInitialState.isError,
        isSuccess: manageSelfScheduleInitialState.isSuccess,
        error: manageSelfScheduleInitialState.error,
      });

      await store.dispatch(
        updateEtaRangesAndCareRequestStatus({
          startsAt: 'startDate',
          endsAt: 'endDate',
          careRequestId: 1,
          careRequestStatusId: 1,
        })
      );
      const rejectedLoadingState = selectManageSelfScheduleLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
      });
    });

    it('updateOffboardReason should update the state', () => {
      const { store } = setupTestStore();

      const initialOffboardReason = selectOffboardReason(store.getState());
      expect(initialOffboardReason).toEqual(
        manageSelfScheduleInitialState.offboardReason
      );

      store.dispatch(updateOffboardReason(OffboardReason.AcuitySegmentation));
      const updatedOffboardReason = selectOffboardReason(store.getState());
      expect(updatedOffboardReason).toEqual(OffboardReason.AcuitySegmentation);
    });
  });

  describe('selectors', () => {
    describe('selectIsRequesterRelationshipSelf', () => {
      it.each([
        {
          relationToPatient: RelationToPatient.Patient,
          expected: true,
        },
        {
          relationToPatient: RelationToPatient.Clinician,
          expected: false,
        },
        {
          relationToPatient: RelationToPatient.FamilyFriend,
          expected: false,
        },
        {
          relationToPatient: RelationToPatient.Other,
          expected: false,
        },
      ])(
        'should select correct isRequesterRelationshipSelf value for $relationToPatient',
        ({ relationToPatient, expected }) => {
          const { store } = setupTestStore();

          const result = selectIsRequesterRelationshipSelf({
            ...store.getState(),
            [manageSelfScheduleSlice.name]: {
              ...manageSelfScheduleInitialState,
              data: {
                ...manageSelfScheduleInitialState.data,
                requester: {
                  relationToPatient,
                },
              },
            },
            [authSlice.name]: initialAuthState,
            [preLoginSlice.name]: {
              ...preLoginInitialState,
              ...mockPersistPartial,
            },
          });

          expect(result).toBe(expected);
        }
      );
    });

    describe('selectMarketFeasibilityLoadingData', () => {
      it('should select correct market feasibility if response is truthy', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
            mockCheckMarketFeasibilityPayload
          )
        );

        const data = selectMarketFeasibilityLoadingData(
          mockCheckMarketFeasibilityPayload
        )(store.getState());

        expect(data).toEqual({
          isLoading: false,
          isError: false,
          isSuccess: true,
        });
      });

      it('should select correct market feasibility if response is unsuccessful', async () => {
        const mockError = { status: 'FETCH_ERROR', error: 'Error: Failed' };
        fetchMock.mockReject(new Error('Failed'));

        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
            mockCheckMarketFeasibilityPayload
          )
        );

        const data = selectMarketFeasibilityLoadingData(
          mockCheckMarketFeasibilityPayload
        )(store.getState());

        expect(data).toEqual({
          isLoading: false,
          isError: true,
          isSuccess: false,
          error: mockError,
        });
      });
    });

    describe('selectMarketFeasibilityStatus', () => {
      it('should select correct market feasibility status if response is truthy', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
            mockCheckMarketFeasibilityPayload
          )
        );

        const data = selectMarketFeasibilityStatus(
          mockCheckMarketFeasibilityPayload
        )(store.getState());

        expect(data).toEqual({
          availabilityStatus: mockCheckMarketFeasibilityData.availability,
        });
      });

      it('should select correct market feasibility status if response is unsuccessful', async () => {
        fetchMock.mockReject(new Error('Failed'));

        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
            mockCheckMarketFeasibilityPayload
          )
        );

        const data = selectMarketFeasibilityStatus(
          mockCheckMarketFeasibilityPayload
        )(store.getState());

        expect(data).toEqual({
          availabilityStatus: undefined,
        });
      });
    });

    describe('selectOffboardReason', () => {
      it('should select correct market feasibility if response is truthy', async () => {
        const { store } = setupTestStore({
          [manageSelfScheduleSlice.name]: {
            offboardReason: OffboardReason.AcuitySegmentation,
          },
        });

        const offboardReason = selectOffboardReason(store.getState());
        expect(offboardReason).toEqual(OffboardReason.AcuitySegmentation);
      });
    });

    describe('selectIsRequesterRelationshipAcuityExcluded', () => {
      it.each([
        {
          relationToPatient: RelationToPatient.Patient,
          expected: false,
        },
        {
          relationToPatient: RelationToPatient.Clinician,
          expected: true,
        },
        {
          relationToPatient: RelationToPatient.FamilyFriend,
          expected: true,
        },
        {
          relationToPatient: RelationToPatient.Other,
          expected: false,
        },
      ])(
        'should select correct isRequesterRelationshipAcuityExcluded value for $relationToPatient',
        ({ relationToPatient, expected }) => {
          const { store } = setupTestStore();

          const result = selectIsRequesterRelationshipAcuityExcluded({
            ...store.getState(),
            [manageSelfScheduleSlice.name]: {
              ...manageSelfScheduleInitialState,
              data: {
                ...manageSelfScheduleInitialState.data,
                requester: {
                  relationToPatient,
                },
              },
            },
          });

          expect(result).toBe(expected);
        }
      );
    });

    describe('selectIsAcuitySegmentationEnabled', () => {
      it.each([
        {
          relationToPatient: RelationToPatient.Patient,
          insurancesData: [mockInsurance],
          expected: true,
        },
        {
          relationToPatient: RelationToPatient.Clinician,
          insurancesData: [mockInsurance],
          expected: false,
        },
      ])(
        'should select correct isRequesterRelationshipAcuityExcluded value for $relationToPatient',
        async ({ relationToPatient, insurancesData, expected }) => {
          fetchMock.mockOnceIf(
            new RegExp(PATIENT_ACCOUNTS_API_PATH),
            JSON.stringify({
              data: mockPatientAccount,
            })
          );

          fetchMock.mockOnceIf(
            new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
            JSON.stringify({ data: mockAccountPatients })
          );

          fetchMock.mockOnceIf(
            new RegExp(
              buildPatientAccountInsurancesPath(mockPatientAccount.id)
            ),
            JSON.stringify({ data: insurancesData })
          );

          fetchMock.mockOnceIf(
            new RegExp(buildMarketPath(1)),
            JSON.stringify({
              data: mockMarket,
            })
          );

          const { store } = setupTestStore({
            [manageSelfScheduleSlice.name]: {
              data: {
                ...manageSelfScheduleInitialState.data,
                marketId: 1,
                patientId: +mockGetPatientInsurancesQuery.patientId,
                requester: {
                  relationToPatient,
                },
              },
            },
          });

          await store.dispatch(
            patientAccountsSlice.endpoints.getAccount.initiate()
          );

          await store.dispatch(
            patientAccountsSlice.endpoints.getAccountPatients.initiate({
              id: mockPatientAccount.id,
            })
          );

          await store.dispatch(
            patientAccountsSlice.endpoints.getPatientInsurances.initiate(
              mockGetPatientInsurancesQuery
            )
          );

          await store.dispatch(marketsSlice.endpoints.getMarket.initiate(1));

          const result = selectIsAcuitySegmentationEnabled({
            acuitySegmentationMarketShortNames: [mockMarket.shortName],
            acuitySegmentationInsuranceClassificationIds: [
              Number(mockInsurance.insuranceNetwork.insuranceClassificationId),
            ],
          })(store.getState());
          expect(result).toBe(expected);
        }
      );
    });
  });

  describe('thunks', () => {
    describe('updateCachedSelfScheduleData', () => {
      it('should update the state on pending status', () => {
        fetchMock.mockResponseOnce(
          JSON.stringify({ data: mockSelfScheduleData })
        );
        const { store } = setupTestStore();

        const initialLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(initialLoadingState).toEqual({
          isLoading: manageSelfScheduleInitialState.isLoading,
          isError: manageSelfScheduleInitialState.isError,
          isSuccess: manageSelfScheduleInitialState.isSuccess,
          error: manageSelfScheduleInitialState.error,
        });

        store.dispatch(updateCachedSelfScheduleData(mockSelfScheduleData));
        const pendingLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(pendingLoadingState).toEqual({
          isLoading: true,
          isError: false,
          isSuccess: false,
        });
      });

      it('cacheSelfScheduleData should update the state on fulfilled status', async () => {
        fetchMock.mockResponseOnce(
          JSON.stringify({ data: mockSelfScheduleData })
        );
        const { store } = setupTestStore();

        const initialLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(initialLoadingState).toEqual({
          isLoading: manageSelfScheduleInitialState.isLoading,
          isError: manageSelfScheduleInitialState.isError,
          isSuccess: manageSelfScheduleInitialState.isSuccess,
          error: manageSelfScheduleInitialState.error,
        });

        await store.dispatch(
          updateCachedSelfScheduleData(mockSelfScheduleData)
        );
        const fulfilledLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(fulfilledLoadingState).toEqual({
          isLoading: false,
          isError: false,
          isSuccess: true,
        });
      });

      it('cacheSelfScheduleData should update the state on rejected status', async () => {
        const mockedError = { message: 'Rejected' };
        fetchMock.mockRejectedValueOnce(mockedError);
        const { store } = setupTestStore();

        const initialLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(initialLoadingState).toEqual({
          isLoading: manageSelfScheduleInitialState.isLoading,
          isError: manageSelfScheduleInitialState.isError,
          isSuccess: manageSelfScheduleInitialState.isSuccess,
          error: manageSelfScheduleInitialState.error,
        });

        await store.dispatch(
          updateCachedSelfScheduleData(mockSelfScheduleData)
        );
        const rejectedLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(rejectedLoadingState).toEqual({
          isLoading: false,
          isError: true,
          isSuccess: false,
          error: mockedError,
        });
      });
    });

    describe('createSelfSchedulingCareRequest', () => {
      it('should update the state on pending status', () => {
        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCreateCareRequestResponse })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildAccountPatientPath(1, 1)),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ data: null })
        );

        const { store } = setupTestStore();

        const initialLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(initialLoadingState).toEqual({
          isLoading: manageSelfScheduleInitialState.isLoading,
          isError: manageSelfScheduleInitialState.isError,
          isSuccess: manageSelfScheduleInitialState.isSuccess,
          error: manageSelfScheduleInitialState.error,
        });

        store.dispatch(
          createSelfSchedulingCareRequest({
            createSelfSchedulingCareRequestPayload:
              mockCreateSelfSchedulingCareRequestPayload,
            acuitySegmentationMarketShortNames: [],
            acuitySegmentationInsuranceClassificationIds: [],
            isSymptomOSSEligible: true,
          })
        );
        const pendingLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(pendingLoadingState).toEqual({
          isLoading: true,
          isError: false,
          isSuccess: false,
        });
      });

      it('should update the state on fulfilled status with error', async () => {
        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCreateCareRequestResponse })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildAccountPatientPath(1, 1)),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ data: null })
        );

        const { store } = setupTestStore();

        const initialLoadingState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(initialLoadingState).toEqual({
          isLoading: manageSelfScheduleInitialState.isLoading,
          isError: manageSelfScheduleInitialState.isError,
          isSuccess: manageSelfScheduleInitialState.isSuccess,
          error: manageSelfScheduleInitialState.error,
        });

        await store.dispatch(
          createSelfSchedulingCareRequest({
            createSelfSchedulingCareRequestPayload:
              mockCreateSelfSchedulingCareRequestPayload,
            acuitySegmentationMarketShortNames: [],
            acuitySegmentationInsuranceClassificationIds: [],
            isSymptomOSSEligible: true,
          })
        );
        const fulfilledState = selectManageSelfScheduleLoadingState(
          store.getState()
        );
        expect(fulfilledState).toEqual({
          isLoading: false,
          isError: true,
          isSuccess: false,
        });
      });

      it('should return isRoutedToCallScreen when insurance is not eligible', async () => {
        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCreateCareRequestResponse })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildAccountPatientPath(1, 1)),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ data: null })
        );

        const { store } = setupTestStore();

        const result = await store.dispatch(
          createSelfSchedulingCareRequest({
            createSelfSchedulingCareRequestPayload:
              mockCreateSelfSchedulingCareRequestPayload,
            acuitySegmentationMarketShortNames: [],
            acuitySegmentationInsuranceClassificationIds: [],
            isSymptomOSSEligible: true,
          })
        );
        expect(result.payload).toEqual({
          careRequestId: mockCreateCareRequestResponse.careRequest.id,
          isError: true,
          isRoutedToCallScreen: true,
        });
      });

      it('should return isRoutedToCallScreen when symptom is not oss eligible', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({ data: mockPatientAccount })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: [mockPatientAccountPatientLink] })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountInsurancesPath(mockPatientAccount.id)),
          JSON.stringify({ data: [mockInsurance] })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCreateCareRequestResponse })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(
            buildAccountPatientPath(mockPatientAccount.id, mockPatient.id)
          ),
          JSON.stringify({ data: mockPatient })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ data: mockSelfScheduleData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildNotificationsPath()),
          JSON.stringify({ data: mockCreateNotificationJobResponse })
        );

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate({
            id: mockPatientAccount.id,
          })
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatientInsurances.initiate({
            accountId: mockPatientAccount.id,
            patientId: mockPatient.id,
          })
        );

        const result = await store.dispatch(
          createSelfSchedulingCareRequest({
            createSelfSchedulingCareRequestPayload:
              mockCreateSelfSchedulingCareRequestPayload,
            acuitySegmentationMarketShortNames: [],
            acuitySegmentationInsuranceClassificationIds: [],
            isSymptomOSSEligible: false,
          })
        );
        expect(result.payload).toEqual({
          careRequestId: mockCreateCareRequestResponse.careRequest.id,
          isError: true,
          isRoutedToCallScreen: true,
        });
      });

      it('should return isRoutedToBookedTimeScreen when time is booked', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({ data: mockPatientAccount })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: mockAccountPatients })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountInsurancesPath(mockPatientAccount.id)),
          JSON.stringify({ data: [mockInsuranceWithEligibleStatus] })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCreateCareRequestResponse })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ data: null })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(
            buildAccountPatientPath(mockPatientAccount.id, mockPatient.id)
          ),
          JSON.stringify({ data: mockPatient })
        );

        const { store } = setupTestStore({
          [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
            ...manageSelfScheduleInitialState,
            data: {
              ...manageSelfScheduleInitialState.data,
              patientId: Number(mockPatientAccountPatientLink.id),
            },
          },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate({
            id: mockPatientAccount.id,
          })
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatientInsurances.initiate({
            accountId: mockPatientAccount.id,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
          })
        );

        const result = await store.dispatch(
          createSelfSchedulingCareRequest({
            createSelfSchedulingCareRequestPayload:
              mockCreateSelfSchedulingCareRequestPayload,
            acuitySegmentationMarketShortNames: [],
            acuitySegmentationInsuranceClassificationIds: [],
            isSymptomOSSEligible: true,
          })
        );
        expect(result.payload).toEqual({
          careRequestId: mockCreateCareRequestResponse.careRequest.id,
          isError: false,
          isRoutedToBookedTimeScreen: true,
        });
      });

      it('should return isError true if updateEtaRangesAndCareRequestStatus failed', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({ data: mockPatientAccount })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: mockAccountPatients })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountInsurancesPath(mockPatientAccount.id)),
          JSON.stringify({ data: [mockInsuranceWithEligibleStatus] })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCreateCareRequestResponse })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ data: null })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        const { store } = setupTestStore({
          [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
            ...manageSelfScheduleInitialState,
            data: {
              ...manageSelfScheduleInitialState.data,
              patientId: Number(mockPatientAccountPatientLink.id),
            },
          },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate({
            id: mockPatientAccount.id,
          })
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatientInsurances.initiate({
            accountId: mockPatientAccount.id,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
          })
        );

        const result = await store.dispatch(
          createSelfSchedulingCareRequest({
            createSelfSchedulingCareRequestPayload:
              mockCreateSelfSchedulingCareRequestPayload,
            acuitySegmentationMarketShortNames: [],
            acuitySegmentationInsuranceClassificationIds: [],
            isSymptomOSSEligible: true,
          })
        );
        expect(result.payload).toEqual({
          careRequestId: mockCreateCareRequestResponse.careRequest.id,
          isError: true,
        });
      });

      it('should return isError false if updateEtaRangesAndCareRequestStatus fulfilled', async () => {
        fetchMock.mockOnceIf(
          new RegExp(PATIENT_ACCOUNTS_API_PATH),
          JSON.stringify({ data: mockPatientAccount })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountPatientsPath(mockPatientAccount.id)),
          JSON.stringify({ data: mockAccountPatients })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildPatientAccountInsurancesPath(mockPatientAccount.id)),
          JSON.stringify({ data: [mockInsuranceWithEligibleStatus] })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCreateCareRequestResponse })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCachePath()),
          JSON.stringify({ data: null })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCheckMarketFeasibilityPath()),
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );

        fetchMock.mockOnceIf(
          new RegExp(buildEtaRangesPath()),
          JSON.stringify({ data: mockEtaRange })
        );

        const mockResponse: PatchCareRequestStatusResponse = { success: true };

        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestStatusPath()),
          JSON.stringify(mockResponse)
        );

        fetchMock.mockOnceIf(
          new RegExp(buildCareRequestPath()),
          JSON.stringify({ data: mockCareRequest })
        );

        const { store } = setupTestStore({
          [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
            ...manageSelfScheduleInitialState,
            data: {
              ...manageSelfScheduleInitialState.data,
              patientId: Number(mockPatientAccountPatientLink.id),
            },
          },
        });

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccount.initiate()
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getAccountPatients.initiate({
            id: mockPatientAccount.id,
          })
        );

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatientInsurances.initiate({
            accountId: mockPatientAccount.id,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
          })
        );

        const result = await store.dispatch(
          createSelfSchedulingCareRequest({
            createSelfSchedulingCareRequestPayload:
              mockCreateSelfSchedulingCareRequestPayload,
            acuitySegmentationMarketShortNames: [],
            acuitySegmentationInsuranceClassificationIds: [],
            isSymptomOSSEligible: true,
          })
        );
        expect(result.payload).toEqual({
          careRequestId: mockCreateCareRequestResponse.careRequest.id,
          isError: false,
        });
      });
    });
  });
});
