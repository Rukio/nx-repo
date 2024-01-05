import {
  createSlice,
  createSelector,
  PayloadAction,
  isAnyOf,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import {
  networksSlice,
  domainSelectServiceLines,
  domainSelectNetworkServiceLines,
  domainSelectNetworkCreditCardRules,
  NetworkIdSelectQuery,
  selectNetworksDomain,
  selectInsuranceClassifications,
  SearchInsuranceNetworkPayload,
  PatchNetworkStatesPayload,
  domainSelectNetworkAppointmentTypes,
} from '../../domain';
import {
  insuranceNetworkToInsuranceNetworkFormData,
  prepareInsuranceNetworkRequestData,
  toPaginatedNetworks,
  prepareNetworkStateRequestData,
  transformDomainServiceLinesList,
  getActiveStatesIds,
  transformAndFilterDomainStatesList,
} from '../../utils/mappers';
import { RootState } from '../../store';
import {
  ManageNetworksState,
  InsuranceNetworkForm,
  InsuranceNetworkServiceLineCreditCardRule,
  NetworkServiceLine,
  NetworkBillingCitiesFilterOptions,
  NetworkServiceLineWithAppointmentTypes,
  InsuranceNetworkServiceLineAppointmentType,
  InsuranceAddress,
} from './types';
import { NetworksSortDirection, NetworksSortField } from '../../types';
import { domainSelectStates } from '../../domain/statesSlice';
import {
  selectFilterableNetworkModalityConfigs,
  selectNetworkModalityConfigs,
} from '../../feature/manageNetworkModalities';

export const MANAGE_NETWORKS_KEY = 'manageNetworks';
const INITIAL_NETWORKS_ADDRESS_STATE: InsuranceAddress = {
  addressLineOne: '',
  city: '',
  stateName: '',
  zipCode: '',
};

export const manageNetworksInitialState: ManageNetworksState = {
  appliedFilterOptions: {
    sortField: NetworksSortField.NAME,
    sortDirection: NetworksSortDirection.ASC,
  },
  selectedFilterOptions: {
    selectedStateAbbrs: [],
    selectedInsuranceClassifications: [],
  },
  network: {
    name: '',
    packageId: '',
    notes: '',
    active: false,
    eligibilityCheck: false,
    providerEnrollment: false,
    insuranceClassificationId: '',
    insurancePayerId: '',
    insurancePlanId: '',
    emcCode: '',
    address: INITIAL_NETWORKS_ADDRESS_STATE,
    addresses: [],
  },
  serviceLineCreditCardRules: [],
  serviceLineAppointmentTypes: [],
  page: 0,
  rowsPerPage: 10,
  networkBillingCitiesFiltersOptions: {},
};

export const resetNetworkCreditCardRules = createAsyncThunk<
  InsuranceNetworkServiceLineCreditCardRule[],
  string | number
>('manageNetworks/resetNetworkCreditCardRules', (networkId, { getState }) => {
  return (
    domainSelectNetworkCreditCardRules(networkId)(getState() as RootState)
      .data || []
  );
});

export const resetNetworkAppointmentTypes = createAsyncThunk<
  InsuranceNetworkServiceLineAppointmentType[],
  string | number
>('manageNetworks/resetNetworkAppointmentTypes', (networkId, { getState }) => {
  return (
    domainSelectNetworkAppointmentTypes(networkId)(getState() as RootState)
      .data || []
  );
});

export const manageNetworksSlice = createSlice({
  name: MANAGE_NETWORKS_KEY,
  initialState: manageNetworksInitialState,
  reducers: {
    resetNetworkForm(state) {
      state.network = manageNetworksInitialState.network;
    },
    updateNetworkFormField(
      state,
      action: PayloadAction<{
        fieldName: string;
        value: string | boolean;
      }>
    ) {
      const { fieldName, value } = action.payload;
      state.network = {
        ...state.network,
        [fieldName]: value,
      };
    },
    updateNetworkAddressFormField(
      state,
      action: PayloadAction<{
        fieldName: string;
        value: string;
        addressToUpdateIndex: number;
      }>
    ) {
      const currentAddresses = [...state.network.addresses];
      const { fieldName, value, addressToUpdateIndex } = action.payload;
      if (addressToUpdateIndex === 0) {
        state.network.address = {
          ...state.network.address,
          [fieldName]: value,
        };
      }
      currentAddresses[addressToUpdateIndex] = {
        ...currentAddresses[addressToUpdateIndex],
        [fieldName]: value,
      };
      state.network.addresses = currentAddresses;
    },
    addAddress(state) {
      const newAddress: InsuranceAddress = {
        ...INITIAL_NETWORKS_ADDRESS_STATE,
      };

      state.network.addresses = [...state.network.addresses, newAddress];
    },
    removeAddress(state, action: PayloadAction<number>) {
      const addressToRemoveIndex = action.payload;
      const currentAddresses = [...state.network.addresses];

      currentAddresses.splice(addressToRemoveIndex, 1);

      state.network.addresses = currentAddresses;
    },
    upsertNetworkCreditCardRules(
      state,
      action: PayloadAction<
        Pick<
          InsuranceNetworkServiceLineCreditCardRule,
          'creditCardRule' | 'serviceLineId'
        >
      >
    ) {
      const { payload } = action;
      const currentRules = [...state.serviceLineCreditCardRules];
      const currentRuleIndex = state.serviceLineCreditCardRules.findIndex(
        (rule) => rule.serviceLineId === payload.serviceLineId
      );

      if (currentRuleIndex !== -1) {
        currentRules[currentRuleIndex].creditCardRule = payload.creditCardRule;
      } else {
        currentRules.push(payload);
      }

      state.serviceLineCreditCardRules = currentRules;
    },
    setNetworksPage(
      state,
      action: PayloadAction<Pick<ManageNetworksState, 'page'>>
    ) {
      state.page = action.payload.page;
    },
    setNetworksRowsPerPage(
      state,
      action: PayloadAction<Pick<ManageNetworksState, 'rowsPerPage'>>
    ) {
      state.rowsPerPage = action.payload.rowsPerPage;
    },
    setNetworksStateFilter(state, action: PayloadAction<string[]>) {
      state.appliedFilterOptions.stateAbbrs = action.payload;
    },
    resetNetworksStateFilter(state) {
      state.appliedFilterOptions.stateAbbrs =
        manageNetworksInitialState.appliedFilterOptions.stateAbbrs;
    },
    setNetworksClassificationsFilter(state, action: PayloadAction<string[]>) {
      state.appliedFilterOptions.insuranceClassifications = action.payload;
    },
    resetNetworksClassificationsFilter(state) {
      state.appliedFilterOptions.insuranceClassifications =
        manageNetworksInitialState.appliedFilterOptions.insuranceClassifications;
    },
    setSelectedStateAbbrsToFilterNetworks(
      state,
      action: PayloadAction<string>
    ) {
      const { payload } = action;
      const { selectedStateAbbrs } = state.selectedFilterOptions;

      state.selectedFilterOptions.selectedStateAbbrs =
        selectedStateAbbrs.includes(payload)
          ? selectedStateAbbrs.filter((stateAbbr) => stateAbbr !== payload)
          : [...selectedStateAbbrs, payload];
    },
    resetSelectedStateAbbrsToFilterNetworks(state) {
      state.selectedFilterOptions.selectedStateAbbrs =
        manageNetworksInitialState.selectedFilterOptions.selectedStateAbbrs;
    },
    setSelectedClassificationsToFilterNetworks(
      state,
      action: PayloadAction<string>
    ) {
      const { payload } = action;
      const { selectedInsuranceClassifications: selectedClassifications } =
        state.selectedFilterOptions;

      state.selectedFilterOptions.selectedInsuranceClassifications =
        selectedClassifications.includes(payload)
          ? selectedClassifications.filter(
              (classification) => classification !== payload
            )
          : [...selectedClassifications, payload];
    },
    resetSelectedClassificationsToFilterNetworks(state) {
      state.selectedFilterOptions.selectedInsuranceClassifications =
        manageNetworksInitialState.selectedFilterOptions.selectedInsuranceClassifications;
    },
    setNetworksSortField(state, action: PayloadAction<NetworksSortField>) {
      state.appliedFilterOptions.sortField = action.payload;
    },
    setNetworksSortDirection(
      state,
      action: PayloadAction<NetworksSortDirection>
    ) {
      state.appliedFilterOptions.sortDirection = action.payload;
    },
    setNetworkBillingCitiesFilterOptions(
      state,
      action: PayloadAction<Partial<NetworkBillingCitiesFilterOptions>>
    ) {
      state.networkBillingCitiesFiltersOptions = {
        ...state.networkBillingCitiesFiltersOptions,
        ...action.payload,
      };
    },
    resetNetworkBillingCitiesFilterOptions(state) {
      state.networkBillingCitiesFiltersOptions =
        manageNetworksInitialState.networkBillingCitiesFiltersOptions;
    },
    upsertNetworkAppointmentTypes(
      state,
      action: PayloadAction<InsuranceNetworkServiceLineAppointmentType>
    ) {
      const {
        payload: {
          networkId,
          serviceLineId,
          modalityType,
          newPatientAppointmentType,
          existingPatientAppointmentType,
        },
      } = action;
      const currentAppointmentTypes = [...state.serviceLineAppointmentTypes];
      const currentAppointmentTypeIndex =
        state.serviceLineAppointmentTypes.findIndex(
          (rule) =>
            rule.serviceLineId === serviceLineId &&
            rule.modalityType === modalityType
        );

      if (currentAppointmentTypeIndex !== -1) {
        const currentAppointmentType =
          currentAppointmentTypes[currentAppointmentTypeIndex];
        if (newPatientAppointmentType) {
          currentAppointmentType.newPatientAppointmentType =
            newPatientAppointmentType;
        }

        if (existingPatientAppointmentType) {
          currentAppointmentType.existingPatientAppointmentType =
            existingPatientAppointmentType;
        }
      } else {
        currentAppointmentTypes.push({
          networkId,
          serviceLineId,
          modalityType,
          newPatientAppointmentType,
          existingPatientAppointmentType,
        });
      }

      state.serviceLineAppointmentTypes = currentAppointmentTypes;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetNetworkCreditCardRules.fulfilled, (state, action) => {
      state.error = undefined;
      state.isError = undefined;
      state.isLoading = undefined;
      state.isSuccess = undefined;
      state.serviceLineCreditCardRules = action.payload;
    });
    builder.addCase(resetNetworkAppointmentTypes.fulfilled, (state, action) => {
      state.error = undefined;
      state.isError = undefined;
      state.isLoading = undefined;
      state.isSuccess = undefined;
      state.serviceLineAppointmentTypes = action.payload;
    });
    builder.addMatcher(
      networksSlice.endpoints.getNetworkCreditCardRules.matchFulfilled,
      (state, action) => {
        state.serviceLineCreditCardRules = action.payload;
      }
    );
    builder.addMatcher(
      networksSlice.endpoints.getNetworkAppointmentTypes.matchFulfilled,
      (state, action) => {
        state.serviceLineAppointmentTypes = action.payload;
      }
    );
    builder.addMatcher(
      isAnyOf(
        networksSlice.endpoints.createNetwork.matchPending,
        networksSlice.endpoints.patchNetwork.matchPending,
        networksSlice.endpoints.patchNetworkCreditCardRules.matchPending,
        networksSlice.endpoints.patchNetworkStates.matchPending,
        networksSlice.endpoints.patchNetworkAppointmentTypes.matchPending
      ),
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      isAnyOf(
        networksSlice.endpoints.createNetwork.matchFulfilled,
        networksSlice.endpoints.patchNetwork.matchFulfilled,
        networksSlice.endpoints.patchNetworkCreditCardRules.matchFulfilled,
        networksSlice.endpoints.patchNetworkStates.matchFulfilled,
        networksSlice.endpoints.patchNetworkAppointmentTypes.matchFulfilled
      ),
      (state) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      isAnyOf(
        networksSlice.endpoints.createNetwork.matchRejected,
        networksSlice.endpoints.patchNetwork.matchRejected,
        networksSlice.endpoints.patchNetworkCreditCardRules.matchRejected,
        networksSlice.endpoints.patchNetworkStates.matchRejected,
        networksSlice.endpoints.patchNetworkAppointmentTypes.matchRejected
      ),
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
    builder.addMatcher(
      networksSlice.endpoints.getNetwork.matchFulfilled,
      (state, action) => {
        state.network = insuranceNetworkToInsuranceNetworkFormData(
          action.payload
        );
      }
    );
  },
});

export const createInsuranceNetwork = (
  data: InsuranceNetworkForm,
  insurancePayerId: string
) =>
  networksSlice.endpoints.createNetwork.initiate(
    prepareInsuranceNetworkRequestData({ ...data, insurancePayerId })
  );

export const updateInsuranceNetwork = (
  networkId: number,
  data: InsuranceNetworkForm
) =>
  networksSlice.endpoints.patchNetwork.initiate({
    id: networkId,
    ...prepareInsuranceNetworkRequestData(data),
  });

export const patchNetworkStates = (data: PatchNetworkStatesPayload) =>
  networksSlice.endpoints.patchNetworkStates.initiate(
    prepareNetworkStateRequestData(data)
  );

export const updateInsuranceNetworkCreditCardRules = (
  networkId: string | number,
  creditCardRules: InsuranceNetworkServiceLineCreditCardRule[]
) => {
  return networksSlice.endpoints.patchNetworkCreditCardRules.initiate({
    networkId,
    creditCardRules,
  });
};

export const selectManageNetworksState = (state: RootState) =>
  state[MANAGE_NETWORKS_KEY];

export const selectNetworkForm = createSelector(
  selectManageNetworksState,
  (manageNetworksState) => manageNetworksState.network
);

export const selectServiceLines = createSelector(
  domainSelectServiceLines,
  ({ isError, isLoading, error, data, isSuccess }) => ({
    isError,
    isLoading,
    error,
    isSuccess,
    serviceLines: transformDomainServiceLinesList(data),
  })
);

export const selectManageNetworksLoadingState = createSelector(
  selectManageNetworksState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

export const selectNetworkCreditCardRules = createSelector(
  selectManageNetworksState,
  ({ serviceLineCreditCardRules }) => serviceLineCreditCardRules
);

export const selectNetworkAppointmentTypes = createSelector(
  selectManageNetworksState,
  ({ serviceLineAppointmentTypes }) => serviceLineAppointmentTypes
);

export const selectNetworkAllServiceLinesCreditCardRules = (
  networkId: NetworkIdSelectQuery
) =>
  createSelector(
    [
      domainSelectServiceLines,
      domainSelectNetworkServiceLines(networkId),
      selectNetworkCreditCardRules,
    ],
    (
      { data: allServiceLines = [] },
      { data: networkServiceLines = [] },
      networkCreditCardRules
    ): NetworkServiceLine[] => {
      return allServiceLines.map((serviceLine) => {
        const isNetworkServiceLine = !!networkServiceLines.find(
          (networkServiceLine) => networkServiceLine.id === serviceLine.id
        );
        const networkServiceLineRule = networkCreditCardRules.find(
          (rule) => rule.serviceLineId === serviceLine.id
        );

        if (isNetworkServiceLine && networkServiceLineRule) {
          return {
            serviceLineId: networkServiceLineRule.serviceLineId,
            serviceLineName: serviceLine.name,
            creditCardRule: networkServiceLineRule.creditCardRule,
          };
        }

        return {
          serviceLineId: serviceLine.id,
          serviceLineName: serviceLine.name,
          disabled: !isNetworkServiceLine,
        };
      });
    }
  );

export const selectPaginatedNetworks = (
  searchInsuranceNetworksPayload: SearchInsuranceNetworkPayload
) =>
  createSelector(
    selectManageNetworksState,
    selectNetworksDomain(searchInsuranceNetworksPayload),
    selectInsuranceClassifications,
    (
      { page, rowsPerPage },
      { data: networks = [] },
      { data: insuranceClassifications = [] }
    ) => ({
      displayedNetworks: toPaginatedNetworks(
        networks,
        insuranceClassifications,
        page,
        rowsPerPage
      ),
      total: networks?.length,
    })
  );

export const selectNetworksPage = createSelector(
  selectManageNetworksState,
  (manageNetworksState) => manageNetworksState.page
);
export const selectNetworksRowsPerPage = createSelector(
  selectManageNetworksState,
  (manageNetworksState) => manageNetworksState.rowsPerPage
);

export const selectAppliedNetworkFilterOptions = createSelector(
  selectManageNetworksState,
  (manageNetworksState) => manageNetworksState.appliedFilterOptions
);

export const selectSelectedNetworkFilterOptions = createSelector(
  selectManageNetworksState,
  (manageNetworksState) => manageNetworksState.selectedFilterOptions
);

export const selectNetworkBillingCitiesFilterOptions = createSelector(
  selectManageNetworksState,
  (manageNetworksState) =>
    manageNetworksState.networkBillingCitiesFiltersOptions
);

export const selectFilteredStatesData = createSelector(
  domainSelectStates,
  selectManageNetworksState,
  selectFilterableNetworkModalityConfigs,
  (
    manageStatesState,
    { networkBillingCitiesFiltersOptions },
    selectedNetworkModalityConfigs
  ) =>
    transformAndFilterDomainStatesList(
      manageStatesState.data,
      networkBillingCitiesFiltersOptions.stateId,
      networkBillingCitiesFiltersOptions.serviceLineId,
      networkBillingCitiesFiltersOptions.statesStatusOption,
      selectedNetworkModalityConfigs
    )
);
export const selectActiveStatesIds = createSelector(
  domainSelectStates,
  selectNetworkModalityConfigs,
  ({ data: states }, selectedNetworkModalityConfigs) =>
    getActiveStatesIds(states, selectedNetworkModalityConfigs)
);

export const selectNetworkAllServiceLinesAppointmentTypes = (
  networkId: NetworkIdSelectQuery
) =>
  createSelector(
    [domainSelectServiceLines, domainSelectNetworkServiceLines(networkId)],
    (
      { data: allServiceLines = [] },
      { data: networkServiceLines = [] }
    ): NetworkServiceLineWithAppointmentTypes[] => {
      return allServiceLines.map((serviceLine) => {
        const isNetworkServiceLine = !!networkServiceLines.find(
          (networkServiceLine) => networkServiceLine.id === serviceLine.id
        );

        return {
          serviceLineId: serviceLine.id,
          serviceLineName: serviceLine.name,
          existingPatientAppointmentType:
            serviceLine.existingPatientAppointmentType?.id,
          newPatientAppointmentType: serviceLine.newPatientAppointmentType?.id,
          disabled: !isNetworkServiceLine,
        };
      });
    }
  );

export const updateInsuranceNetworkApointmentTypes = (
  networkId: string | number,
  data: InsuranceNetworkServiceLineAppointmentType[]
) =>
  networksSlice.endpoints.patchNetworkAppointmentTypes.initiate({
    networkId,
    appointmentTypes: data,
  });

export const selectAllStates = createSelector(
  domainSelectStates,
  ({ data: states }) => states
);

export const {
  updateNetworkFormField,
  updateNetworkAddressFormField,
  resetNetworkForm,
  upsertNetworkCreditCardRules,
  setNetworksPage,
  setNetworksRowsPerPage,
  setNetworksStateFilter,
  resetNetworksStateFilter,
  setNetworksClassificationsFilter,
  resetNetworksClassificationsFilter,
  setSelectedStateAbbrsToFilterNetworks,
  resetSelectedStateAbbrsToFilterNetworks,
  setSelectedClassificationsToFilterNetworks,
  resetSelectedClassificationsToFilterNetworks,
  setNetworksSortField,
  setNetworksSortDirection,
  setNetworkBillingCitiesFilterOptions,
  resetNetworkBillingCitiesFilterOptions,
  upsertNetworkAppointmentTypes,
  addAddress,
  removeAddress,
} = manageNetworksSlice.actions;
