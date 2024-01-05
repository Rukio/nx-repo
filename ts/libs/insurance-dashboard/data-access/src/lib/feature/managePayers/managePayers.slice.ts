import {
  createSlice,
  createSelector,
  PayloadAction,
  isAnyOf,
} from '@reduxjs/toolkit';
import { payersSlice, selectPayersDomain } from '../../domain';
import {
  PayersQuery,
  PayersSortFields,
  PayersSortDirection,
  PayersListSortOptions,
} from '../../types';
import {
  prepareInsurancePayerRequestData,
  insurancePayerToInsurancePayerFormData,
  transformPayerGroupsList,
  insurancePayersToInsurancePayersList,
  getPaginatedInsurancePayers,
  transformDomainStatesList,
} from '../../utils/mappers';
import { RootState } from '../../store';
import { ManagePayersState, InsurancePayerForm } from './types';
import { selectPayerGroups as domainSelectPayerGroups } from '../../domain/payerGroupsSlice';
import { domainSelectStates } from '../../domain/statesSlice';

export const MANAGE_PAYERS_KEY = 'managePayers';

export const managePayersInitialState: ManagePayersState = {
  payersFilterOptions: {},
  payersListSortOptions: {
    field: PayersSortFields.NAME,
    direction: PayersSortDirection.ASC,
  },
  payerForm: {
    name: '',
    notes: '',
    active: false,
  },
  page: 0,
  rowsPerPage: 25,
};

export const managePayersSlice = createSlice({
  name: MANAGE_PAYERS_KEY,
  initialState: managePayersInitialState,
  reducers: {
    updatePayerFormField(
      state,
      action: PayloadAction<{
        fieldName: string;
        value: string | number | boolean;
      }>
    ) {
      const { fieldName, value } = action.payload;
      state.payerForm = {
        ...state.payerForm,
        [fieldName]: value,
      };
    },
    resetPayerForm(state) {
      state.payerForm = managePayersInitialState.payerForm;
    },
    setPayersSort(state, action: PayloadAction<PayersListSortOptions>) {
      state.payersListSortOptions = action.payload;
    },
    setPayersSearchString(state, action: PayloadAction<string>) {
      state.payersFilterOptions.payerName = action.payload;
    },
    setPayersStateFilter(state, action: PayloadAction<string[]>) {
      state.payersFilterOptions.stateAbbrs = action.payload;
    },
    setPayersActiveStateFilter(state, action: PayloadAction<string[]>) {
      state.payersFilterOptions.activeStateAbbrs = action.payload;
    },
    resetPayersStateFilter(state) {
      state.payersFilterOptions.activeStateAbbrs =
        managePayersInitialState.payersFilterOptions.activeStateAbbrs;
      state.payersFilterOptions.stateAbbrs =
        managePayersInitialState.payersFilterOptions.stateAbbrs;
    },
    setPage(state, action: PayloadAction<Pick<ManagePayersState, 'page'>>) {
      state.page = action.payload.page;
    },
    setRowsPerPage(
      state,
      action: PayloadAction<Pick<ManagePayersState, 'rowsPerPage'>>
    ) {
      state.rowsPerPage = action.payload.rowsPerPage;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      isAnyOf(
        payersSlice.endpoints.createPayer.matchPending,
        payersSlice.endpoints.patchPayer.matchPending,
        payersSlice.endpoints.deletePayer.matchPending,
        payersSlice.endpoints.getPayers.matchPending
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
        payersSlice.endpoints.createPayer.matchFulfilled,
        payersSlice.endpoints.patchPayer.matchFulfilled,
        payersSlice.endpoints.deletePayer.matchFulfilled,
        payersSlice.endpoints.getPayers.matchFulfilled
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
        payersSlice.endpoints.createPayer.matchRejected,
        payersSlice.endpoints.patchPayer.matchRejected,
        payersSlice.endpoints.deletePayer.matchRejected,
        payersSlice.endpoints.getPayers.matchRejected
      ),
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
    builder.addMatcher(
      payersSlice.endpoints.getPayer.matchFulfilled,
      (state, action) => {
        state.payerForm = insurancePayerToInsurancePayerFormData(
          action.payload
        );
      }
    );
  },
});

export const createInsurancePayer = (data: InsurancePayerForm) =>
  payersSlice.endpoints.createPayer.initiate(
    prepareInsurancePayerRequestData(data)
  );

export const updateInsurancePayer = (
  payerId: number,
  data: InsurancePayerForm
) =>
  payersSlice.endpoints.patchPayer.initiate({
    id: payerId,
    ...prepareInsurancePayerRequestData(data),
  });

export const selectManagePayersState = (state: RootState) =>
  state[MANAGE_PAYERS_KEY];

export const selectPayersList = (query?: PayersQuery) =>
  createSelector(
    selectPayersDomain(query),
    domainSelectPayerGroups,
    ({ data: domainPayers }, { data: domainPayerGroups }) => ({
      payers: insurancePayersToInsurancePayersList(
        domainPayers,
        domainPayerGroups
      ),
    })
  );

export const selectPaginatedPayersData = (query?: PayersQuery) =>
  createSelector(
    selectManagePayersState,
    selectPayersList(query),
    ({ page, rowsPerPage }, { payers }) => ({
      paginatedPayers: getPaginatedInsurancePayers(payers, rowsPerPage, page),
      total: payers.length,
    })
  );

export const selectPayerForm = createSelector(
  selectManagePayersState,
  (managePayersState) => managePayersState.payerForm
);

export const selectPayersSort = createSelector(
  selectManagePayersState,
  (managePayersState) => managePayersState.payersListSortOptions
);

export const selectPayersFilterOptions = createSelector(
  selectManagePayersState,
  (managePayersState) => managePayersState.payersFilterOptions
);
export const selectPage = createSelector(
  selectManagePayersState,
  (managePayersState) => managePayersState.page
);
export const selectRowsPerPage = createSelector(
  selectManagePayersState,
  (managePayersState) => managePayersState.rowsPerPage
);

export const selectManagePayersLoadingState = createSelector(
  selectManagePayersState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

export const selectPayerGroupsForm = createSelector(
  domainSelectPayerGroups,
  ({ data }) => transformPayerGroupsList(data)
);

export const selectManagePayerGroupsLoadingState = createSelector(
  domainSelectPayerGroups,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

export const selectStatesData = createSelector(
  domainSelectStates,
  (manageStatesState) => transformDomainStatesList(manageStatesState.data)
);

export const selectStatesLoadingState = createSelector(
  domainSelectStates,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

export const {
  updatePayerFormField,
  resetPayerForm,
  setPayersSort,
  setPayersSearchString,
  setPayersStateFilter,
  setPayersActiveStateFilter,
  resetPayersStateFilter,
  setPage,
  setRowsPerPage,
} = managePayersSlice.actions;
