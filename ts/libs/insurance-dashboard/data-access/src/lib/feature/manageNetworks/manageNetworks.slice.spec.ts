import {
  manageNetworksSlice,
  manageNetworksInitialState,
  selectNetworkForm,
  selectManageNetworksLoadingState,
  createInsuranceNetwork,
  resetNetworkForm,
  updateNetworkFormField,
  updateInsuranceNetwork,
  selectNetworkCreditCardRules,
  upsertNetworkCreditCardRules,
  updateInsuranceNetworkCreditCardRules,
  selectNetworkAllServiceLinesCreditCardRules,
  resetNetworkCreditCardRules,
  selectNetworksRowsPerPage,
  selectNetworksPage,
  setNetworksPage,
  setNetworksRowsPerPage,
  selectPaginatedNetworks,
  selectAppliedNetworkFilterOptions,
  setNetworksStateFilter,
  resetNetworksStateFilter,
  setNetworksClassificationsFilter,
  resetNetworksClassificationsFilter,
  selectSelectedNetworkFilterOptions,
  setSelectedStateAbbrsToFilterNetworks,
  resetSelectedStateAbbrsToFilterNetworks,
  setSelectedClassificationsToFilterNetworks,
  resetSelectedClassificationsToFilterNetworks,
  setNetworksSortField,
  setNetworksSortDirection,
  patchNetworkStates,
  selectNetworkBillingCitiesFilterOptions,
  setNetworkBillingCitiesFilterOptions,
  resetNetworkBillingCitiesFilterOptions,
  selectActiveStatesIds,
  resetNetworkAppointmentTypes,
  selectNetworkAppointmentTypes,
  upsertNetworkAppointmentTypes,
  selectNetworkAllServiceLinesAppointmentTypes,
  updateNetworkAddressFormField,
  addAddress,
  removeAddress,
} from './manageNetworks.slice';
import {
  AppliedNetworksFilterOptions,
  InsuranceNetworkForm,
  InsuranceNetworkServiceLineCreditCardRule,
} from './types';
import {
  mockedNetworkFormData,
  mockedCreditCardRules,
  mockedNetworkServiceLines,
  mockedPatchNetworkStatesInitialData,
  mockedMultipleNetworkAddresses,
} from './mocks';
import { setupTestStore } from '../../../testUtils';
import {
  mockedInsuranceNetwork,
  networksSlice,
  buildNetworkCreditCardRulesPath,
  buildNetworkServiceLinesPath,
  serviceLinesSlice,
  SERVICE_LINES_API_PATH,
  SearchInsuranceNetworkPayload,
  STATES_API_PATH,
  statesSlice,
  networkModalitiesSlice,
  mockedStatePA,
  mockedNetworkModalityConfigs,
  mockedInsuranceNetworkAppointmentTypes,
  mockedServiceLineNetworkAppointmentTypes,
  buildNetworkAppointmentTypesPath,
} from '../../domain';
import {
  NetworkCreditCardRules,
  NetworksSortDirection,
  NetworksSortField,
} from '../../types';
import { mockedNetworkRowData } from './mocks';

const mockedNetworkId = 1;

const mockedInsurancePayerId = '1';
const mockedSelectedStateAbbrToFilterNetworks = 'AL';
const mockedSelectedClassificationToFilterNetworks = '1';
const mockedAppliedStateAbbrsToFilterNetworks = ['AL', 'AK', 'AZ'];
const mockedAppliedClassificationsIdsToFilterNetworks = ['1'];
const mockedNetworksSortOptions: Pick<
  AppliedNetworksFilterOptions,
  'sortField' | 'sortDirection'
> = {
  sortField: NetworksSortField.UPDATED_AT,
  sortDirection: NetworksSortDirection.DESC,
};

const mockedStateIdToFilterNetworkBillingCities = '1';
const mockedServiceLineIdToFilterNetworkBillingCities = '1';

describe('manageNetworks.slice', () => {
  it('should initialize default reducer state', () => {
    const state = manageNetworksSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(manageNetworksInitialState);
  });

  describe('reducers', () => {
    it('updateNetworkFormField should update the state', () => {
      const store = setupTestStore();

      const initialNetworkForm = selectNetworkForm(store.getState());
      expect(initialNetworkForm).toEqual(manageNetworksInitialState.network);

      store.dispatch(
        updateNetworkFormField({ fieldName: 'name', value: 'network' })
      );
      const updatedNetworkForm = selectNetworkForm(store.getState());
      expect(updatedNetworkForm).toEqual({
        ...manageNetworksInitialState.network,
        name: 'network',
      });
    });

    it('upsertNetworkCreditCardRules should add new rule', () => {
      const store = setupTestStore();

      const initialNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(initialNetworkServiceLineCreditCardRules).toEqual(
        manageNetworksInitialState.serviceLineCreditCardRules
      );

      const mockRule = mockedCreditCardRules[0];
      store.dispatch(upsertNetworkCreditCardRules(mockRule));

      const updatedNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(updatedNetworkServiceLineCreditCardRules).toEqual([mockRule]);
    });

    it('upsertNetworkCreditCardRules should update existing rule', () => {
      const mockedUpdatedRule = NetworkCreditCardRules.optional;
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          serviceLineCreditCardRules: mockedCreditCardRules,
        },
      });

      const initialNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(initialNetworkServiceLineCreditCardRules).toEqual(
        mockedCreditCardRules
      );

      store.dispatch(
        upsertNetworkCreditCardRules({
          ...mockedCreditCardRules[0],
          creditCardRule: mockedUpdatedRule,
        })
      );

      const updatedNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(updatedNetworkServiceLineCreditCardRules).toEqual([
        { ...mockedCreditCardRules[0], creditCardRule: mockedUpdatedRule },
        ...mockedCreditCardRules.slice(1),
      ]);
    });

    it('resetNetworkForm should reset form data to initial state', () => {
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          network: mockedNetworkFormData,
        },
      });

      const initialNetworkForm = selectNetworkForm(store.getState());
      expect(initialNetworkForm).toEqual(mockedNetworkFormData);

      store.dispatch(resetNetworkForm());
      const updatedNetworkForm = selectNetworkForm(store.getState());
      expect(updatedNetworkForm).toEqual(manageNetworksInitialState.network);
    });

    it('resetNetworkCreditCardRules should reset credit card rules changes', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ creditCardRules: mockedCreditCardRules })
      );
      const mockedRule: InsuranceNetworkServiceLineCreditCardRule = {
        serviceLineId: '11',
        creditCardRule: NetworkCreditCardRules.disabled,
      };
      const store = setupTestStore();

      await store.dispatch(
        networksSlice.endpoints.getNetworkCreditCardRules.initiate(
          mockedNetworkId
        )
      );
      store.dispatch(upsertNetworkCreditCardRules(mockedRule));

      const updatedNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(updatedNetworkServiceLineCreditCardRules).toEqual([
        ...mockedCreditCardRules,
        mockedRule,
      ]);

      await store.dispatch(resetNetworkCreditCardRules(mockedNetworkId));
      const resetNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(resetNetworkServiceLineCreditCardRules).toEqual(
        mockedCreditCardRules
      );
    });

    it('networksSlice.endpoints.getNetworkCreditCardRules.matchFulfilled should pre-populate credit card rules state', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ creditCardRules: mockedCreditCardRules })
      );
      const store = setupTestStore();

      const initialNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(initialNetworkServiceLineCreditCardRules).toEqual(
        manageNetworksInitialState.serviceLineCreditCardRules
      );

      await store.dispatch(
        networksSlice.endpoints.getNetworkCreditCardRules.initiate(
          mockedNetworkId
        )
      );

      const updatedNetworkServiceLineCreditCardRules =
        selectNetworkCreditCardRules(store.getState());
      expect(updatedNetworkServiceLineCreditCardRules).toEqual(
        mockedCreditCardRules
      );
    });

    it('createInsuranceNetwork should update the state on pending status', () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedInsuranceNetwork })
      );
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          network: mockedNetworkFormData,
        },
      });

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      store.dispatch(
        createInsuranceNetwork(mockedNetworkFormData, mockedInsurancePayerId)
      );
      const pendingLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('createInsuranceNetwork should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedInsuranceNetwork })
      );
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          network: mockedNetworkFormData,
        },
      });

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      await store.dispatch(
        createInsuranceNetwork(mockedNetworkFormData, mockedInsurancePayerId)
      );
      const fulfilledLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('createInsuranceNetwork should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          network: mockedNetworkFormData,
        },
      });

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      await store.dispatch(
        createInsuranceNetwork(mockedNetworkFormData, mockedInsurancePayerId)
      );
      const rejectedLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('updateInsuranceNetwork should update the state on pending status', () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedInsuranceNetwork })
      );
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          network: mockedNetworkFormData,
        },
      });

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      store.dispatch(
        updateInsuranceNetwork(mockedInsuranceNetwork.id, mockedNetworkFormData)
      );
      const pendingLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('updateInsuranceNetwork should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedInsuranceNetwork })
      );
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          network: mockedNetworkFormData,
        },
      });

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      await store.dispatch(
        updateInsuranceNetwork(mockedInsuranceNetwork.id, mockedNetworkFormData)
      );
      const fulfilledLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('updateInsuranceNetwork should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [manageNetworksSlice.name]: {
          ...manageNetworksInitialState,
          network: mockedNetworkFormData,
        },
      });

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      await store.dispatch(
        updateInsuranceNetwork(mockedInsuranceNetwork.id, mockedNetworkFormData)
      );
      const rejectedLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('getNetwork should set insurance network data once it is loaded', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ network: mockedInsuranceNetwork })
      );
      const store = setupTestStore();
      const initialNetworkFormData = selectNetworkForm(store.getState());

      expect(initialNetworkFormData).toEqual(
        manageNetworksInitialState.network
      );

      await store.dispatch(
        networksSlice.endpoints.getNetwork.initiate(mockedInsuranceNetwork.id)
      );

      const updatedNetworkFormData = selectNetworkForm(store.getState());
      expect(updatedNetworkFormData).toEqual(mockedNetworkFormData);
    });

    it('updateInsuranceNetworkCreditCardRules should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const store = setupTestStore();

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      store.dispatch(
        updateInsuranceNetworkCreditCardRules(
          mockedNetworkId,
          mockedCreditCardRules
        )
      );
      const pendingLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('updateInsuranceNetworkCreditCardRules should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const store = setupTestStore();

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      await store.dispatch(
        updateInsuranceNetworkCreditCardRules(
          mockedNetworkId,
          mockedCreditCardRules
        )
      );
      const fulfilledLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('updateInsuranceNetworkCreditCardRules should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore();

      const initialLoadingState = selectManageNetworksLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworksInitialState.isLoading,
        isError: manageNetworksInitialState.isError,
        isSuccess: manageNetworksInitialState.isSuccess,
        error: manageNetworksInitialState.error,
      });

      await store.dispatch(
        updateInsuranceNetworkCreditCardRules(
          mockedNetworkId,
          mockedCreditCardRules
        )
      );
      const rejectedLoadingState = selectManageNetworksLoadingState(
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

  describe('selectors', () => {
    it('selectNetworkAllServiceLinesCreditCardRules should return mapped credit card rules based on all service lines', async () => {
      const disabledServiceLine = {
        ...mockedNetworkServiceLines[0],
        id: '4',
        name: 'Service Line 4',
      };
      const allServiceLine = [
        ...mockedNetworkServiceLines,
        disabledServiceLine,
      ];
      fetchMock.mockOnceIf(
        new RegExp(buildNetworkCreditCardRulesPath(mockedNetworkId)),
        JSON.stringify({ creditCardRules: mockedCreditCardRules })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildNetworkServiceLinesPath(mockedNetworkId)),
        JSON.stringify({ serviceLines: mockedNetworkServiceLines })
      );
      fetchMock.mockOnceIf(
        new RegExp(SERVICE_LINES_API_PATH),
        JSON.stringify({ serviceLines: allServiceLine })
      );

      const store = setupTestStore();

      await store.dispatch(
        networksSlice.endpoints.getNetworkCreditCardRules.initiate(
          mockedNetworkId
        )
      );
      await store.dispatch(
        networksSlice.endpoints.getNetworkServiceLines.initiate(mockedNetworkId)
      );
      await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );

      const networkServiceLineRulesForAllServiceLines =
        selectNetworkAllServiceLinesCreditCardRules(mockedNetworkId)(
          store.getState()
        );

      const disabledCreditCardRule =
        networkServiceLineRulesForAllServiceLines.find(
          (rule) => rule.serviceLineId === disabledServiceLine.id
        );
      expect(disabledCreditCardRule).toEqual({
        serviceLineId: disabledServiceLine.id,
        serviceLineName: disabledServiceLine.name,
        disabled: true,
      });

      mockedNetworkServiceLines.forEach((serviceLine) => {
        const originalRule = mockedCreditCardRules.find(
          (rule) => rule.serviceLineId === serviceLine.id
        );
        const creditCardRule = networkServiceLineRulesForAllServiceLines.find(
          (rule) => rule.serviceLineId === serviceLine.id
        );

        expect(creditCardRule).toEqual({
          serviceLineId: originalRule?.serviceLineId,
          serviceLineName: serviceLine.name,
          creditCardRule: originalRule?.creditCardRule,
        });
      });
    });

    it('selectNetworkAllServiceLinesAppointmentTypes should return mapped appointmentTypes based on all service lines', async () => {
      const disabledServiceLine = {
        ...mockedNetworkServiceLines[0],
        id: '4',
        name: 'Service Line 4',
      };
      const allServiceLine = [
        ...mockedNetworkServiceLines,
        disabledServiceLine,
      ];
      fetchMock.mockOnceIf(
        new RegExp(buildNetworkAppointmentTypesPath(mockedNetworkId)),
        JSON.stringify({
          appointmentTypes: mockedInsuranceNetworkAppointmentTypes,
        })
      );
      fetchMock.mockOnceIf(
        new RegExp(buildNetworkServiceLinesPath(mockedNetworkId)),
        JSON.stringify({ serviceLines: mockedNetworkServiceLines })
      );
      fetchMock.mockOnceIf(
        new RegExp(SERVICE_LINES_API_PATH),
        JSON.stringify({ serviceLines: allServiceLine })
      );

      const store = setupTestStore();

      await store.dispatch(
        networksSlice.endpoints.getNetworkAppointmentTypes.initiate(
          mockedNetworkId
        )
      );
      await store.dispatch(
        networksSlice.endpoints.getNetworkServiceLines.initiate(mockedNetworkId)
      );
      await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );

      const networkServiceLineAppointmentTypesForAllServiceLines =
        selectNetworkAllServiceLinesAppointmentTypes(mockedNetworkId)(
          store.getState()
        );

      const disabledAppointmtntType =
        networkServiceLineAppointmentTypesForAllServiceLines.find(
          (type) => type.serviceLineId === disabledServiceLine.id
        );
      expect(disabledAppointmtntType).toEqual({
        serviceLineId: disabledServiceLine.id,
        serviceLineName: disabledServiceLine.name,
        existingPatientAppointmentType:
          disabledServiceLine.existingPatientAppointmentType?.id,
        newPatientAppointmentType:
          disabledServiceLine.newPatientAppointmentType?.id,
        disabled: true,
      });

      const serviceLine = mockedNetworkServiceLines[0];
      const originalAppointmentType =
        mockedServiceLineNetworkAppointmentTypes.find(
          (type) => type.serviceLineId === serviceLine.id
        );
      const appointmtntType =
        networkServiceLineAppointmentTypesForAllServiceLines.find(
          (type) => type.serviceLineId === serviceLine.id
        );

      expect(appointmtntType).toEqual({
        serviceLineId: originalAppointmentType?.serviceLineId,
        serviceLineName: serviceLine.name,
        existingPatientAppointmentType:
          originalAppointmentType?.existingPatientAppointmentType,
        newPatientAppointmentType:
          originalAppointmentType?.newPatientAppointmentType,
        disabled: false,
      });
    });

    it('selectPaginatedNetworks should return paginated networks list', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: [mockedInsuranceNetwork] })
      );

      const store = setupTestStore();
      const mockedSearchInsuranceNetworksPayload: SearchInsuranceNetworkPayload =
        {
          payerIds: [mockedInsurancePayerId],
          sortField: NetworksSortField.NAME,
          sortDirection: NetworksSortDirection.ASC,
          showInactive: true,
        };

      await store.dispatch(
        networksSlice.endpoints.searchNetworksList.initiate(
          mockedSearchInsuranceNetworksPayload
        )
      );
      const initialNetworksData = selectPaginatedNetworks(
        mockedSearchInsuranceNetworksPayload
      )(store.getState());

      expect(initialNetworksData).toEqual({
        displayedNetworks: [{ ...mockedNetworkRowData, classification: '' }],
        total: 1,
      });
    });

    it('selectActiveStatesIds should return list of active state ids', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
      fetchMock.mockOnceIf(
        new RegExp(STATES_API_PATH),
        JSON.stringify({
          states: [mockedStatePA],
        })
      );

      const store = setupTestStore();

      await store.dispatch(statesSlice.endpoints.getStates.initiate());
      await store.dispatch(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs.initiate(
          mockedNetworkId
        )
      );
      const selectedActiveStatesIdsData = selectActiveStatesIds(
        store.getState()
      );

      expect(selectedActiveStatesIdsData).toEqual([mockedStatePA.id]);
    });
  });

  it('setNetworksPage should update the state', () => {
    const store = setupTestStore();

    const initialPage = selectNetworksPage(store.getState());
    expect(initialPage).toEqual(manageNetworksInitialState.page);

    store.dispatch(setNetworksPage({ page: 10 }));
    const updatedPage = selectNetworksPage(store.getState());
    expect(updatedPage).toBe(10);
  });

  it('setNetworksRowsPerPage should update the state', () => {
    const store = setupTestStore();

    const initialPage = selectNetworksRowsPerPage(store.getState());
    expect(initialPage).toEqual(manageNetworksInitialState.rowsPerPage);

    store.dispatch(setNetworksRowsPerPage({ rowsPerPage: 100 }));
    const updatedPage = selectNetworksRowsPerPage(store.getState());
    expect(updatedPage).toBe(100);
  });

  it('setNetworksStateFilter should update the state', () => {
    const store = setupTestStore();

    const initialNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(initialNetworksFilters).toEqual(
      manageNetworksInitialState.appliedFilterOptions
    );

    store.dispatch(
      setNetworksStateFilter(mockedAppliedStateAbbrsToFilterNetworks)
    );
    const updatedNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(updatedNetworksFilters).toEqual({
      stateAbbrs: mockedAppliedStateAbbrsToFilterNetworks,
      classifications: undefined,
      sortField: manageNetworksInitialState.appliedFilterOptions.sortField,
      sortDirection:
        manageNetworksInitialState.appliedFilterOptions.sortDirection,
    });
  });

  it('resetNetworksStateFilter should update the state', () => {
    const store = setupTestStore();

    const initialNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(initialNetworksFilters).toEqual(
      manageNetworksInitialState.appliedFilterOptions
    );

    store.dispatch(
      setNetworksStateFilter(mockedAppliedStateAbbrsToFilterNetworks)
    );
    const updatedNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(updatedNetworksFilters).toEqual({
      stateAbbrs: mockedAppliedStateAbbrsToFilterNetworks,
      classifications: undefined,
      sortField: manageNetworksInitialState.appliedFilterOptions.sortField,
      sortDirection:
        manageNetworksInitialState.appliedFilterOptions.sortDirection,
    });
    store.dispatch(resetNetworksStateFilter());
    const resetedNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(resetedNetworksFilters).toEqual(
      manageNetworksInitialState.appliedFilterOptions
    );
  });

  it('setNetworksClassificationsFilter should update the state', () => {
    const store = setupTestStore();

    const initialNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(initialNetworksFilters).toEqual(
      manageNetworksInitialState.appliedFilterOptions
    );

    store.dispatch(
      setNetworksClassificationsFilter(
        mockedAppliedClassificationsIdsToFilterNetworks
      )
    );
    const updatedNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(updatedNetworksFilters).toEqual({
      stateAbbrs: undefined,
      insuranceClassifications: mockedAppliedClassificationsIdsToFilterNetworks,
      sortField: manageNetworksInitialState.appliedFilterOptions.sortField,
      sortDirection:
        manageNetworksInitialState.appliedFilterOptions.sortDirection,
    });
  });

  it('resetNetworksClassificationsFilter should update the state', () => {
    const store = setupTestStore();

    const initialNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(initialNetworksFilters).toEqual(
      manageNetworksInitialState.appliedFilterOptions
    );

    store.dispatch(
      setNetworksClassificationsFilter(
        mockedAppliedClassificationsIdsToFilterNetworks
      )
    );
    const updatedNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(updatedNetworksFilters).toEqual({
      stateAbbrs: undefined,
      insuranceClassifications: mockedAppliedClassificationsIdsToFilterNetworks,
      sortField: manageNetworksInitialState.appliedFilterOptions.sortField,
      sortDirection:
        manageNetworksInitialState.appliedFilterOptions.sortDirection,
    });
    store.dispatch(resetNetworksClassificationsFilter());
    const resetedNetworksFilters = selectAppliedNetworkFilterOptions(
      store.getState()
    );
    expect(resetedNetworksFilters).toEqual(
      manageNetworksInitialState.appliedFilterOptions
    );
  });

  it('setSelectedStateAbbrsToFilterNetworks should update the state', () => {
    const store = setupTestStore();

    const initialSelectedFilterOptions = selectSelectedNetworkFilterOptions(
      store.getState()
    );
    expect(initialSelectedFilterOptions).toEqual(
      manageNetworksInitialState.selectedFilterOptions
    );

    store.dispatch(
      setSelectedStateAbbrsToFilterNetworks(
        mockedSelectedStateAbbrToFilterNetworks
      )
    );
    const updatedSelectedFilterOptions = selectSelectedNetworkFilterOptions(
      store.getState()
    );
    expect(updatedSelectedFilterOptions).toEqual({
      selectedStateAbbrs: [mockedSelectedStateAbbrToFilterNetworks],
      selectedInsuranceClassifications: [],
    });
  });

  it('resetSelectedStateAbbrsToFilterNetworks should update the state', () => {
    const store = setupTestStore();

    store.dispatch(
      setSelectedStateAbbrsToFilterNetworks(
        mockedSelectedStateAbbrToFilterNetworks
      )
    );

    store.dispatch(resetSelectedStateAbbrsToFilterNetworks());
    const resetedSelectedFilterOptions = selectSelectedNetworkFilterOptions(
      store.getState()
    );
    expect(resetedSelectedFilterOptions).toEqual(
      manageNetworksInitialState.selectedFilterOptions
    );
  });

  it('setSelectedClassificationsToFilterNetworks should update the state', () => {
    const store = setupTestStore();

    const initialSelectedFilterOptions = selectSelectedNetworkFilterOptions(
      store.getState()
    );
    expect(initialSelectedFilterOptions).toEqual(
      manageNetworksInitialState.selectedFilterOptions
    );

    store.dispatch(
      setSelectedClassificationsToFilterNetworks(
        mockedSelectedClassificationToFilterNetworks
      )
    );
    const updatedSelectedFilterOptions = selectSelectedNetworkFilterOptions(
      store.getState()
    );
    expect(updatedSelectedFilterOptions).toEqual({
      selectedStateAbbrs: [],
      selectedInsuranceClassifications: [
        mockedSelectedClassificationToFilterNetworks,
      ],
    });
  });

  it('resetSelectedClassificationsToFilterNetworks should update the state', () => {
    const store = setupTestStore();

    store.dispatch(
      setSelectedClassificationsToFilterNetworks(
        mockedSelectedClassificationToFilterNetworks
      )
    );

    store.dispatch(resetSelectedClassificationsToFilterNetworks());
    const resetedSelectedFilterOptions = selectSelectedNetworkFilterOptions(
      store.getState()
    );
    expect(resetedSelectedFilterOptions).toEqual(
      manageNetworksInitialState.selectedFilterOptions
    );
  });

  it('setNetworksSortField should update the state', () => {
    const store = setupTestStore();

    const { sortField: initialNetworksSortField } =
      selectAppliedNetworkFilterOptions(store.getState());
    expect(initialNetworksSortField).toEqual(
      manageNetworksInitialState.appliedFilterOptions.sortField
    );

    store.dispatch(setNetworksSortField(mockedNetworksSortOptions.sortField));
    const { sortField: updatedNetworksSortField } =
      selectAppliedNetworkFilterOptions(store.getState());
    expect(updatedNetworksSortField).toEqual(
      mockedNetworksSortOptions.sortField
    );
  });

  it('setNetworksSortDirection should update the state', () => {
    const store = setupTestStore();

    const { sortDirection: initialNetworksSortDirection } =
      selectAppliedNetworkFilterOptions(store.getState());
    expect(initialNetworksSortDirection).toEqual(
      manageNetworksInitialState.appliedFilterOptions.sortDirection
    );

    store.dispatch(
      setNetworksSortDirection(mockedNetworksSortOptions.sortDirection)
    );
    const { sortDirection: updatedNetworksSortDirection } =
      selectAppliedNetworkFilterOptions(store.getState());
    expect(updatedNetworksSortDirection).toEqual(
      mockedNetworksSortOptions.sortDirection
    );
  });

  it('patchNetworkStates should update the network states on pending status', () => {
    fetchMock.mockResponse(
      JSON.stringify({
        state_abbrs: mockedPatchNetworkStatesInitialData.stateAbbrs,
      })
    );
    const store = setupTestStore();

    const initialLoadingState = selectManageNetworksLoadingState(
      store.getState()
    );
    expect(initialLoadingState).toEqual({
      isLoading: manageNetworksInitialState.isLoading,
      isError: manageNetworksInitialState.isError,
      isSuccess: manageNetworksInitialState.isSuccess,
      error: manageNetworksInitialState.error,
    });

    store.dispatch(patchNetworkStates(mockedPatchNetworkStatesInitialData));

    const pendingLoadingState = selectManageNetworksLoadingState(
      store.getState()
    );
    expect(pendingLoadingState).toEqual({
      isLoading: true,
      isError: false,
      isSuccess: false,
    });
  });

  it('patchNetworkStates should update the network states on fulfilled status', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        state_abbrs: mockedPatchNetworkStatesInitialData.stateAbbrs,
      })
    );
    const store = setupTestStore();

    const initialLoadingState = selectManageNetworksLoadingState(
      store.getState()
    );
    expect(initialLoadingState).toEqual({
      isLoading: manageNetworksInitialState.isLoading,
      isError: manageNetworksInitialState.isError,
      isSuccess: manageNetworksInitialState.isSuccess,
      error: manageNetworksInitialState.error,
    });

    await store.dispatch(
      patchNetworkStates(mockedPatchNetworkStatesInitialData)
    );

    const fulfilledLoadingState = selectManageNetworksLoadingState(
      store.getState()
    );
    expect(fulfilledLoadingState).toEqual({
      isLoading: false,
      isError: false,
      isSuccess: true,
    });
  });

  it('patchNetworkStates should update the network states on rejected status', async () => {
    const mockedError = { message: 'Rejected' };
    fetchMock.mockRejectedValue(mockedError);
    const store = setupTestStore();

    const initialLoadingState = selectManageNetworksLoadingState(
      store.getState()
    );
    expect(initialLoadingState).toEqual({
      isLoading: manageNetworksInitialState.isLoading,
      isError: manageNetworksInitialState.isError,
      isSuccess: manageNetworksInitialState.isSuccess,
      error: manageNetworksInitialState.error,
    });

    await store.dispatch(
      patchNetworkStates(mockedPatchNetworkStatesInitialData)
    );

    const rejectedLoadingState = selectManageNetworksLoadingState(
      store.getState()
    );
    expect(rejectedLoadingState).toEqual({
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: mockedError,
    });
  });

  it('setNetworkBillingCitiesFilterOptions should update the stateId', () => {
    const store = setupTestStore();

    const initialFilters = selectNetworkBillingCitiesFilterOptions(
      store.getState()
    );
    expect(initialFilters).toEqual(
      manageNetworksInitialState.networkBillingCitiesFiltersOptions
    );

    store.dispatch(
      setNetworkBillingCitiesFilterOptions({
        stateId: mockedStateIdToFilterNetworkBillingCities,
      })
    );
    const { stateId } = selectNetworkBillingCitiesFilterOptions(
      store.getState()
    );
    expect(stateId).toBe(mockedStateIdToFilterNetworkBillingCities);
  });

  it('setNetworkBillingCitiesFilterOptions should update the serviceLineId', () => {
    const store = setupTestStore();

    const initialFilters = selectNetworkBillingCitiesFilterOptions(
      store.getState()
    );
    expect(initialFilters).toEqual(
      manageNetworksInitialState.networkBillingCitiesFiltersOptions
    );

    store.dispatch(
      setNetworkBillingCitiesFilterOptions({
        serviceLineId: mockedServiceLineIdToFilterNetworkBillingCities,
      })
    );
    const { serviceLineId } = selectNetworkBillingCitiesFilterOptions(
      store.getState()
    );
    expect(serviceLineId).toBe(mockedServiceLineIdToFilterNetworkBillingCities);
  });

  it('resetNetworkBillingCitiesFilterOptions should update the state', () => {
    const store = setupTestStore({
      [manageNetworksSlice.name]: {
        ...manageNetworksInitialState,
        networkBillingCitiesFiltersOptions: {
          stateId: mockedStateIdToFilterNetworkBillingCities,
          serviceLineId: mockedServiceLineIdToFilterNetworkBillingCities,
        },
      },
    });

    const initialFilters = selectNetworkBillingCitiesFilterOptions(
      store.getState()
    );
    expect(initialFilters).toEqual({
      stateId: mockedStateIdToFilterNetworkBillingCities,
      serviceLineId: mockedServiceLineIdToFilterNetworkBillingCities,
    });

    store.dispatch(resetNetworkBillingCitiesFilterOptions());
    const resetedFilters = selectNetworkBillingCitiesFilterOptions(
      store.getState()
    );
    expect(resetedFilters).toEqual(
      manageNetworksInitialState.networkBillingCitiesFiltersOptions
    );
  });

  it('resetNetworkAppointmentTypes should reset appointmentTypes changes', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        appointmentTypes: [],
      })
    );
    const store = setupTestStore();
    const mockAppointmentType = mockedServiceLineNetworkAppointmentTypes[0];

    store.dispatch(upsertNetworkAppointmentTypes(mockAppointmentType));

    const networkServiceLineAppointmentTypes = selectNetworkAppointmentTypes(
      store.getState()
    );
    expect(networkServiceLineAppointmentTypes).toEqual([mockAppointmentType]);

    await store.dispatch(resetNetworkAppointmentTypes(mockedNetworkId));
    const resetNetworkServiceLineAppointmentTypes =
      selectNetworkAppointmentTypes(store.getState());
    expect(resetNetworkServiceLineAppointmentTypes).toEqual([]);
  });

  it('upsertNetworkAppointmentTypes should add new appointmentType', () => {
    const store = setupTestStore();

    const initialNetworkServiceLineAppointmentTypes =
      selectNetworkAppointmentTypes(store.getState());
    expect(initialNetworkServiceLineAppointmentTypes).toEqual(
      manageNetworksInitialState.serviceLineAppointmentTypes
    );

    const mockAppointmentType = mockedServiceLineNetworkAppointmentTypes[0];
    store.dispatch(upsertNetworkAppointmentTypes(mockAppointmentType));

    const updatedNetworkServiceLineAppointmentTypes =
      selectNetworkAppointmentTypes(store.getState());
    expect(updatedNetworkServiceLineAppointmentTypes).toEqual([
      mockAppointmentType,
    ]);
  });

  it('upsertNetworkAppointmentTypes should update existing appointmentType', () => {
    const mockAppointmentType = mockedServiceLineNetworkAppointmentTypes[0];
    const store = setupTestStore({
      [manageNetworksSlice.name]: {
        ...manageNetworksInitialState,
        serviceLineAppointmentTypes: [mockAppointmentType],
      },
    });

    const initialNetworkServiceLineAppointmentTypes =
      selectNetworkAppointmentTypes(store.getState());
    expect(initialNetworkServiceLineAppointmentTypes).toEqual([
      mockAppointmentType,
    ]);

    store.dispatch(
      upsertNetworkAppointmentTypes({
        ...mockedServiceLineNetworkAppointmentTypes[0],
        newPatientAppointmentType: '2',
      })
    );

    const updatedNetworkServiceLineAppointmentTypes =
      selectNetworkAppointmentTypes(store.getState());
    expect(updatedNetworkServiceLineAppointmentTypes).toEqual([
      {
        ...mockedServiceLineNetworkAppointmentTypes[0],
        newPatientAppointmentType: '2',
      },
    ]);
  });

  it('updateNetworkAddressFormField should update the state', () => {
    const mockAddresToUpdateIndex = 0;

    const store = setupTestStore();

    const initialNetworkForm = selectNetworkForm(store.getState());
    expect(initialNetworkForm).toEqual(manageNetworksInitialState.network);

    store.dispatch(
      updateNetworkAddressFormField({
        fieldName: 'city',
        value: 'City 1',
        addressToUpdateIndex: mockAddresToUpdateIndex,
      })
    );

    const updatedNetworkForm = selectNetworkForm(store.getState());
    expect(updatedNetworkForm).toEqual({
      ...manageNetworksInitialState.network,
      address: {
        ...manageNetworksInitialState.network.address,
        city: mockedNetworkFormData.address.city,
      },
      addresses: [
        {
          ...manageNetworksInitialState.network.addresses[
            mockAddresToUpdateIndex
          ],
          city: mockedNetworkFormData.addresses[mockAddresToUpdateIndex].city,
        },
      ],
    });
  });

  it('addAnotherAddress should add new address', () => {
    const store = setupTestStore();

    const initialNetworkForm = selectNetworkForm(store.getState());
    expect(initialNetworkForm).toEqual(manageNetworksInitialState.network);
    expect(initialNetworkForm.addresses).toHaveLength(0);

    store.dispatch(addAddress());

    const updatedNetworkForm = selectNetworkForm(store.getState());
    expect(updatedNetworkForm.addresses).toHaveLength(1);
  });

  it('removeAdditionalAddress should remove address with passed index', () => {
    const mockedNetworkFormDataWithMultipleAddresses: InsuranceNetworkForm = {
      ...mockedNetworkFormData,
      addresses: mockedMultipleNetworkAddresses,
    };
    const mockAddresToRemoveIndex = 1;
    const store = setupTestStore({
      [manageNetworksSlice.name]: {
        ...manageNetworksInitialState,
        network: mockedNetworkFormDataWithMultipleAddresses,
      },
    });

    const initialNetworkForm = selectNetworkForm(store.getState());
    expect(initialNetworkForm).toEqual(
      mockedNetworkFormDataWithMultipleAddresses
    );
    expect(initialNetworkForm.addresses).toHaveLength(3);

    store.dispatch(removeAddress(mockAddresToRemoveIndex));

    const updatedNetworkForm = selectNetworkForm(store.getState());
    expect(updatedNetworkForm.addresses).toHaveLength(2);
    expect(updatedNetworkForm.addresses[1].city).toEqual(
      mockedMultipleNetworkAddresses[2].city
    );
  });
});
