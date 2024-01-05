import { setupTestStore } from '../../../testUtils';
import {
  CheckInsuranceEligibilityPayload,
  buildPatientAccountCheckEligibilityPath,
  buildPatientAccountInsurancesPath,
  buildPatientAccountInsurancePath,
  mockCheckInsuranceEligibilityPayload,
  mockCreatePatientAccountInsurancePayload,
  mockGetPatientInsurancesQuery,
  mockInsurance,
  mockInsuranceWithEligibleStatus,
  mockPatientAccountCheckEligibilityQuery,
  mockUpdatePatientAccountInsurancePayload,
  patientAccountsSlice,
  mockedInsuranceClassifications,
  selfScheduleSlice,
  mockedNetworksListWithDifferentPayers,
  buildInsuranceNetworksPath,
  buildInsuranceClassificationsPath,
  mockedPayersWithClassifications,
  buildMarketPath,
  mockMarket,
  marketsSlice,
  PATIENT_ACCOUNTS_API_PATH,
  mockPatientAccount,
  mockAccountPatients,
  buildPatientAccountPatientsPath,
} from '../../domain';
import { InsuranceEligibilityStatus, ListNetworksPayload } from '../../types';
import {
  manageSelfScheduleInitialState,
  manageSelfScheduleSlice,
} from '../manageSelfScheduleSlice';
import {
  INSURANCES_SLICE_KEY,
  insurancesInitialState,
  manageInsurancesSlice,
  selectInsurancesData,
  resetInsurance,
  selectManageInsurancesLoadingState,
  checkInsuranceEligibility,
  selectInsuranceEligibility,
  selectPatientPrimaryInsurance,
  selectPatientSecondaryInsurance,
  selectPayersFromNetworksWithClassifications,
  selectIsAnyPatientInsuranceAcuitySegmented,
  selectIsPrimaryInsuranceOssEligible,
} from './manageInsurances.slice';
import { InsurancesState } from './types';

const mockedInsuranceData: InsurancesState = {
  insuranceId: '1',
  insuranceEligibility: InsuranceEligibilityStatus.Eligible,
  isLoaded: false,
};
const mockPrimaryInsuranceIndex = 0;
const mockSecondaryInsuranceIndex = 1;

describe('manageInsurances.slice', () => {
  it('should initialize default reducer state', () => {
    const state = manageInsurancesSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(insurancesInitialState);
  });

  describe('reducers', () => {
    it('should reset insurance state on resetInsurance action', () => {
      const { store } = setupTestStore({
        [INSURANCES_SLICE_KEY]: mockedInsuranceData,
      });

      const initialInsuranceData = selectInsurancesData(store.getState());
      expect(initialInsuranceData).toEqual(mockedInsuranceData);

      store.dispatch(resetInsurance());
      const resetedInsuranceData = selectInsurancesData(store.getState());
      expect(resetedInsuranceData).toEqual(insurancesInitialState);
    });

    it('checkInsuranceEligibility should update the state on pending status', async () => {
      const { accountId } = mockCreatePatientAccountInsurancePayload;

      fetchMock.mockOnceIf(
        new RegExp(buildPatientAccountInsurancesPath(accountId)),
        JSON.stringify({ data: mockInsurance })
      );

      const { accountId: patientAccountId, insuranceId } =
        mockPatientAccountCheckEligibilityQuery;

      fetchMock.mockOnceIf(
        new RegExp(
          buildPatientAccountCheckEligibilityPath(patientAccountId, insuranceId)
        ),
        JSON.stringify({
          data: mockInsuranceWithEligibleStatus,
        })
      );

      const { store } = setupTestStore();

      const initialLoadingState = selectManageInsurancesLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: insurancesInitialState.isLoading,
        isError: insurancesInitialState.isError,
        isSuccess: insurancesInitialState.isSuccess,
        error: insurancesInitialState.error,
        isLoaded: insurancesInitialState.isLoaded,
      });

      store.dispatch(
        checkInsuranceEligibility(mockCheckInsuranceEligibilityPayload)
      );

      const pendingLoadingState = selectManageInsurancesLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
        isLoaded: false,
      });
    });

    it('checkInsuranceEligibility should update the state on fulfilled status', async () => {
      const { accountId } = mockCreatePatientAccountInsurancePayload;

      fetchMock.mockOnceIf(
        new RegExp(buildPatientAccountInsurancesPath(accountId)),
        JSON.stringify({ data: mockInsurance })
      );

      const { accountId: patientAccountId, insuranceId } =
        mockPatientAccountCheckEligibilityQuery;

      fetchMock.mockOnceIf(
        new RegExp(
          buildPatientAccountCheckEligibilityPath(patientAccountId, insuranceId)
        ),
        JSON.stringify({
          data: mockInsuranceWithEligibleStatus,
        })
      );

      const { store } = setupTestStore();

      const initialLoadingState = selectManageInsurancesLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: insurancesInitialState.isLoading,
        isError: insurancesInitialState.isError,
        isSuccess: insurancesInitialState.isSuccess,
        error: insurancesInitialState.error,
        isLoaded: insurancesInitialState.isLoaded,
      });

      await store.dispatch(
        checkInsuranceEligibility(mockCheckInsuranceEligibilityPayload)
      );

      const fulfilledLoadingState = selectManageInsurancesLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        isLoaded: false,
      });

      const fulfilledInsuranceEligibility = selectInsuranceEligibility(
        store.getState()
      );
      expect(fulfilledInsuranceEligibility).toEqual(
        InsuranceEligibilityStatus.Eligible
      );
    });
  });

  describe('selectors', () => {
    describe.each([
      {
        selectorName: 'selectPatientPrimaryInsurance',
        insurances: [mockInsuranceWithEligibleStatus],
        selector: selectPatientPrimaryInsurance,
        index: mockPrimaryInsuranceIndex,
      },
      {
        selectorName: 'selectPatientSecondaryInsurance',
        insurances: [
          mockInsuranceWithEligibleStatus,
          { ...mockInsuranceWithEligibleStatus, id: '2', priority: '2' },
        ],
        selector: selectPatientSecondaryInsurance,
        index: mockSecondaryInsuranceIndex,
      },
    ])('$selectorName', ({ insurances, selector, index }) => {
      it('should select correct insurance', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: insurances }));

        const { store } = setupTestStore();

        await store.dispatch(
          patientAccountsSlice.endpoints.getPatientInsurances.initiate(
            mockGetPatientInsurancesQuery
          )
        );

        const result = selector(mockGetPatientInsurancesQuery)(
          store.getState()
        );
        expect(result).toEqual(insurances[index]);
      });

      it("should return null if patient's insurances list is empty", async () => {
        const { store } = setupTestStore();

        const result = selector(mockGetPatientInsurancesQuery)(
          store.getState()
        );
        expect(result).toBeNull();
      });
    });

    describe('selectPayersFromNetworksWithClassifications', () => {
      it('should select correct payers from networks and map with classifications', async () => {
        const { store } = setupTestStore();

        fetchMock.mockOnceIf(
          new RegExp(buildInsuranceNetworksPath()),
          JSON.stringify({
            data: mockedNetworksListWithDifferentPayers,
          })
        );
        fetchMock.mockOnceIf(
          new RegExp(buildInsuranceClassificationsPath()),
          JSON.stringify({ data: mockedInsuranceClassifications })
        );

        await store.dispatch(
          selfScheduleSlice.endpoints.listNetworks.initiate({})
        );
        await store.dispatch(
          selfScheduleSlice.endpoints.getInsuranceClassifications.initiate()
        );

        const result = selectPayersFromNetworksWithClassifications()(
          store.getState()
        );

        expect(result).toEqual(mockedPayersWithClassifications);
      });

      it('should select correct payers from networks and map with correct classifications', async () => {
        const mockedClassificationIds = ['1', '2'];
        const mockedSearchInsuranceNetworksPayload: ListNetworksPayload = {
          insuranceClassifications: mockedClassificationIds,
        };

        const { store } = setupTestStore();

        fetchMock.mockOnceIf(
          new RegExp(buildInsuranceNetworksPath()),
          JSON.stringify({
            data: mockedNetworksListWithDifferentPayers,
          })
        );
        fetchMock.mockOnceIf(
          new RegExp(buildInsuranceClassificationsPath()),
          JSON.stringify({ data: mockedInsuranceClassifications })
        );

        await store.dispatch(
          selfScheduleSlice.endpoints.listNetworks.initiate(
            mockedSearchInsuranceNetworksPayload
          )
        );
        await store.dispatch(
          selfScheduleSlice.endpoints.getInsuranceClassifications.initiate()
        );

        const result = selectPayersFromNetworksWithClassifications(
          mockedClassificationIds
        )(store.getState());

        expect(result).toEqual(mockedPayersWithClassifications);
      });
    });

    describe('selectIsAnyPatientInsuranceAcuitySegmented', () => {
      it.each([
        {
          name: 'should return truthy if primary insurance is acuity segmented',
          insurancesData: [mockInsurance],
          expected: true,
        },
        {
          name: 'should return false if secondary insurance is acuity segmented',
          insurancesData: [
            { ...mockInsurance, insuranceNetwork: null },
            mockInsurance,
          ],
          expected: false,
        },
        {
          name: 'should return true if primary and secondary insurance is acuity segmented',
          insurancesData: [mockInsurance, mockInsurance],
          expected: true,
        },
      ])('$name', async ({ insurancesData, expected }) => {
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
          new RegExp(buildPatientAccountInsurancesPath(mockPatientAccount.id)),
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

        const result = selectIsAnyPatientInsuranceAcuitySegmented({
          acuitySegmentationMarketShortNames: [mockMarket.shortName],
          acuitySegmentationInsuranceClassificationIds: [
            Number(mockInsurance.insuranceNetwork.insuranceClassificationId),
          ],
        })(store.getState());
        expect(result).toBe(expected);
      });
    });

    describe('selectIsPrimaryInsuranceOssEligible', () => {
      it.each([
        {
          name: 'should return true if primary insurance exists, eligible and in network',
          insurancesData: [mockInsurance],
          expected: true,
        },
        {
          name: 'should return false if primary insurance is empty',
          insurancesData: [],
          expected: false,
        },
        {
          name: 'should return false if primary insurance is ineligible',
          insurancesData: [
            {
              ...mockInsurance,
              eligible: InsuranceEligibilityStatus.Ineligible,
            },
          ],
          expected: false,
        },
        {
          name: 'should return false if primary insurance has no network',
          insurancesData: [{ ...mockInsurance, insuranceNetwork: null }],
          expected: false,
        },
      ])('$name', async ({ insurancesData, expected }) => {
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
          new RegExp(buildPatientAccountInsurancesPath(mockPatientAccount.id)),
          JSON.stringify({ data: insurancesData })
        );

        const { store } = setupTestStore({
          [manageSelfScheduleSlice.name]: {
            data: {
              ...manageSelfScheduleInitialState.data,
              patientId: +mockGetPatientInsurancesQuery.patientId,
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

        const result = selectIsPrimaryInsuranceOssEligible(store.getState());
        expect(result).toBe(expected);
      });
    });
  });

  describe('thunks', () => {
    describe('checkInsuranceEligibility', () => {
      it.each([
        {
          insurance: 'created insurance',
          insuranceRequestPath: buildPatientAccountInsurancesPath(
            mockCreatePatientAccountInsurancePayload.accountId
          ),
          payload: mockCheckInsuranceEligibilityPayload,
        },
        {
          insurance: 'updated insurance',
          insuranceRequestPath: buildPatientAccountInsurancePath(
            mockUpdatePatientAccountInsurancePayload.accountId,
            mockUpdatePatientAccountInsurancePayload.insuranceId
          ),
          payload: { ...mockCheckInsuranceEligibilityPayload, insuranceId: 1 },
        },
      ])(
        'should return falsy isError and $insurance with eligibile status when success',
        async ({ insuranceRequestPath, payload }) => {
          fetchMock.mockOnceIf(
            new RegExp(insuranceRequestPath),
            JSON.stringify({ data: mockInsurance })
          );

          const { accountId: patientAccountId, insuranceId } =
            mockPatientAccountCheckEligibilityQuery;

          fetchMock.mockOnceIf(
            new RegExp(
              buildPatientAccountCheckEligibilityPath(
                patientAccountId,
                insuranceId
              )
            ),
            JSON.stringify({
              data: mockInsuranceWithEligibleStatus,
            })
          );

          const { store } = setupTestStore();

          const data = await store
            .dispatch(checkInsuranceEligibility(payload))
            .unwrap();

          expect(data).toEqual({
            isError: false,
            insuranceWithEligibleStatus: mockInsuranceWithEligibleStatus,
            checkEligibilityError: null,
          });
        }
      );

      it.each([
        {
          error: 'createInsuranceError when creation of insurance failed',
          payload: mockCheckInsuranceEligibilityPayload,
          result: {
            isError: true,
            createInsuranceError: expect.objectContaining({
              error: 'Error: Failed',
            }),
            updateInsuranceError: null,
          },
        },
        {
          error: 'updateInsuranceError when updating of insurance failed',
          payload: { ...mockCheckInsuranceEligibilityPayload, insuranceId: 1 },
          result: {
            isError: true,
            createInsuranceError: null,
            updateInsuranceError: expect.objectContaining({
              error: 'Error: Failed',
            }),
          },
        },
      ])(
        'should return truthy isError and $error',
        async ({ payload, result }) => {
          const mockError = 'Error: Failed';

          fetchMock.mockRejectedValue(mockError);

          const { store } = setupTestStore();

          const data = await store
            .dispatch(checkInsuranceEligibility(payload))
            .unwrap();

          expect(data).toEqual(result);
        }
      );

      it.each([
        {
          insuranceRequestPath: buildPatientAccountInsurancesPath(
            mockCreatePatientAccountInsurancePayload.accountId
          ),
          payload: mockCheckInsuranceEligibilityPayload,
        },
        {
          insuranceRequestPath: buildPatientAccountInsurancePath(
            mockUpdatePatientAccountInsurancePayload.accountId,
            mockUpdatePatientAccountInsurancePayload.insuranceId
          ),
          payload: { ...mockCheckInsuranceEligibilityPayload, insuranceId: 1 },
        },
      ])(
        'should return truthy isError and checkEligibilityError when check eligibility failed',
        async ({ insuranceRequestPath, payload }) => {
          const mockError = 'Error: Failed';

          fetchMock.mockOnceIf(
            new RegExp(insuranceRequestPath),
            JSON.stringify({ data: mockInsurance })
          );
          fetchMock.mockRejectedValue(mockError);

          const { store } = setupTestStore();

          const data = await store
            .dispatch(checkInsuranceEligibility(payload))
            .unwrap();

          expect(data).toEqual({
            isError: true,
            insuranceWithEligibleStatus: null,
            checkEligibilityError: expect.objectContaining({
              error: mockError,
            }),
          });
        }
      );

      it.each([
        {
          title: 'accountId is',
          accountId: undefined,
          patientId: mockCheckInsuranceEligibilityPayload.patientId,
        },
        {
          title: 'patientId is',
          accountId: mockCheckInsuranceEligibilityPayload.accountId,
          patientId: undefined,
        },
        {
          title: 'accountId and patientId are',
          accountId: undefined,
          patientId: undefined,
        },
      ])(
        'should return truthy isError when $title undefined',
        async ({ accountId, patientId }) => {
          const mockPayload: CheckInsuranceEligibilityPayload = {
            ...mockCheckInsuranceEligibilityPayload,
            accountId,
            patientId,
          };

          const { store } = setupTestStore();

          const data = await store
            .dispatch(checkInsuranceEligibility(mockPayload))
            .unwrap();

          expect(data).toEqual({
            isError: true,
          });
        }
      );
    });
  });
});
