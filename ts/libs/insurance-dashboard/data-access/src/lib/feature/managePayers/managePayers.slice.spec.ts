import {
  managePayersSlice,
  managePayersInitialState,
  updatePayerFormField,
  selectPayerForm,
  selectManagePayersLoadingState,
  createInsurancePayer,
  resetPayerForm,
  updateInsurancePayer,
  selectPage,
  setPage,
  setPayersSort,
  selectPayersSort,
  selectPayersFilterOptions,
  setPayersSearchString,
  setPayersStateFilter,
  setPayersActiveStateFilter,
  resetPayersStateFilter,
  selectPayersList,
  selectRowsPerPage,
  setRowsPerPage,
} from './managePayers.slice';
import { payersSlice } from '../../domain/payersSlice';
import {
  PayersQuery,
  PayersSortDirection,
  PayersSortFields,
} from '../../types';
import {
  mockedPayerData,
  mockedPayerFormData,
  MOCKED_SEARCH_STRING,
} from './mocks';
import { setupTestStore } from '../../../testUtils';
import { mockedInsurancePayer } from '../../domain/payersSlice';
import { mockedStates } from '../../domain/statesSlice';
import { insurancePayerToInsurancePayerFormData } from '../../utils/mappers';
import {
  PAYER_GROUPS_API_PATH,
  mockedInsurancePayerGroups,
  payerGroupsSlice,
} from '../../domain/payerGroupsSlice';

describe('managePayers.slice', () => {
  it('should initialize default reducer state', () => {
    const state = managePayersSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(managePayersInitialState);
  });

  describe('reducers', () => {
    it('updatePayerFormField should update the state', () => {
      const store = setupTestStore();

      const initialPayerForm = selectPayerForm(store.getState());
      expect(initialPayerForm).toEqual(managePayersInitialState.payerForm);

      store.dispatch(
        updatePayerFormField({ fieldName: 'name', value: 'payer' })
      );
      const updatedPayerForm = selectPayerForm(store.getState());
      expect(updatedPayerForm).toEqual({
        ...managePayersInitialState.payerForm,
        name: 'payer',
      });
    });

    it('resetPayerForm should reset form data to initial state', () => {
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialPayerForm = selectPayerForm(store.getState());
      expect(initialPayerForm).toEqual(mockedPayerFormData);

      store.dispatch(resetPayerForm());
      const updatedPayerForm = selectPayerForm(store.getState());
      expect(updatedPayerForm).toEqual(managePayersInitialState.payerForm);
    });

    it('setPage should update the state', () => {
      const store = setupTestStore();

      const initialPage = selectPage(store.getState());
      expect(initialPage).toEqual(managePayersInitialState.page);

      store.dispatch(setPage({ page: 10 }));
      const updatedPage = selectPage(store.getState());
      expect(updatedPage).toBe(10);
    });

    it('setRowsPerPage should update the state', () => {
      const store = setupTestStore();

      const initialPage = selectRowsPerPage(store.getState());
      expect(initialPage).toEqual(managePayersInitialState.rowsPerPage);

      store.dispatch(setRowsPerPage({ rowsPerPage: 100 }));
      const updatedPage = selectRowsPerPage(store.getState());
      expect(updatedPage).toBe(100);
    });

    it('createInsurancePayer should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      store.dispatch(createInsurancePayer(mockedPayerFormData));
      const pendingLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('createInsurancePayer should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(createInsurancePayer(mockedPayerFormData));
      const fulfilledLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('createInsurancePayer should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(createInsurancePayer(mockedPayerFormData));
      const rejectedLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('updateInsurancePayer should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      store.dispatch(
        updateInsurancePayer(mockedInsurancePayer.id, mockedPayerFormData)
      );
      const pendingLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('updateInsurancePayer should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(
        updateInsurancePayer(mockedInsurancePayer.id, mockedPayerFormData)
      );
      const fulfilledLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('updateInsurancePayer should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(
        updateInsurancePayer(mockedInsurancePayer.id, mockedPayerFormData)
      );
      const rejectedLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('deletePayer should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      store.dispatch(
        payersSlice.endpoints.deletePayer.initiate(mockedInsurancePayer.id)
      );
      const pendingLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('deletePayer should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(
        payersSlice.endpoints.deletePayer.initiate(mockedInsurancePayer.id)
      );
      const fulfilledLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('deletePayer should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [managePayersSlice.name]: {
          ...managePayersInitialState,
          payerForm: mockedPayerFormData,
        },
      });

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(
        payersSlice.endpoints.deletePayer.initiate(mockedInsurancePayer.id)
      );
      const rejectedLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('getPayer should set insurance payer data once it is loaded', async () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockedInsurancePayer }));
      const store = setupTestStore();
      const initialPayerFormData = selectPayerForm(store.getState());

      expect(initialPayerFormData).toEqual(managePayersInitialState.payerForm);

      await store.dispatch(
        payersSlice.endpoints.getPayer.initiate(mockedInsurancePayer.id)
      );

      const updatedPayerFormData = selectPayerForm(store.getState());
      expect(updatedPayerFormData).toEqual(
        insurancePayerToInsurancePayerFormData(mockedInsurancePayer)
      );
    });

    it('getPayers should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const store = setupTestStore();

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      store.dispatch(payersSlice.endpoints.getPayers.initiate());
      const pendingLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('getPayers should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payers: [mockedInsurancePayer] })
      );
      const store = setupTestStore();

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(payersSlice.endpoints.getPayers.initiate());
      const fulfilledLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('getPayers should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore();

      const initialLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: managePayersInitialState.isLoading,
        isError: managePayersInitialState.isError,
        isSuccess: managePayersInitialState.isSuccess,
        error: managePayersInitialState.error,
      });

      await store.dispatch(payersSlice.endpoints.getPayers.initiate());
      const rejectedLoadingState = selectManagePayersLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('setPayersSort should update the state', () => {
      const store = setupTestStore();

      const initialPayersSort = selectPayersSort(store.getState());
      expect(initialPayersSort).toEqual(
        managePayersInitialState.payersListSortOptions
      );

      store.dispatch(
        setPayersSort({
          field: PayersSortFields.NAME,
          direction: PayersSortDirection.DESC,
        })
      );
      const updatedPayersSort = selectPayersSort(store.getState());
      expect(updatedPayersSort).toEqual({
        field: PayersSortFields.NAME,
        direction: PayersSortDirection.DESC,
      });
    });

    it('getPayers should get the payers once it is loaded', async () => {
      const mockedPayersResponse = [
        { ...mockedPayerData, payerGroup: undefined },
      ];
      fetchMock.mockResponse(
        JSON.stringify({
          payers: mockedPayersResponse,
        })
      );
      const store = setupTestStore();
      const query: PayersQuery = {
        sortField: PayersSortFields.NAME,
        sortDirection: PayersSortDirection.ASC,
      };
      await store.dispatch(payersSlice.endpoints.getPayers.initiate(query));
      const payers = selectPayersList(query)(store.getState());
      expect(payers).toEqual({ payers: mockedPayersResponse });

      await store.dispatch(payersSlice.endpoints.getPayers.initiate(undefined));
      const payersNoQuery = selectPayersList()(store.getState());
      expect(payersNoQuery).toEqual({ payers: mockedPayersResponse });
    });

    it('setPayersSearchString should update the state', () => {
      const store = setupTestStore();

      const initialPayersFilters = selectPayersFilterOptions(store.getState());
      expect(initialPayersFilters).toEqual(
        managePayersInitialState.payersFilterOptions
      );

      store.dispatch(setPayersSearchString(MOCKED_SEARCH_STRING));
      const updatedPayersFilters = selectPayersFilterOptions(store.getState());
      expect(updatedPayersFilters).toEqual({
        payerName: MOCKED_SEARCH_STRING,
      });
    });

    it('setPayersStateFilter should update the state', () => {
      const store = setupTestStore();

      const initialPayersFilters = selectPayersFilterOptions(store.getState());
      expect(initialPayersFilters).toEqual(
        managePayersInitialState.payersFilterOptions
      );

      store.dispatch(setPayersStateFilter([mockedStates[0].abbreviation]));
      const updatedPayersFilters = selectPayersFilterOptions(store.getState());
      expect(updatedPayersFilters).toEqual({
        stateAbbrs: [mockedStates[0].abbreviation],
      });
    });

    it('setPayersActiveStateFilter should update the state', () => {
      const store = setupTestStore();

      const initialPayersFilters = selectPayersFilterOptions(store.getState());
      expect(initialPayersFilters).toEqual(
        managePayersInitialState.payersFilterOptions
      );

      store.dispatch(
        setPayersActiveStateFilter([mockedStates[0].abbreviation])
      );
      const updatedPayersFilters = selectPayersFilterOptions(store.getState());
      expect(updatedPayersFilters).toEqual({
        activeStateAbbrs: [mockedStates[0].abbreviation],
      });
    });

    it('resetPayersStateFilter should update the state', () => {
      const store = setupTestStore();

      const initialPayersFilters = selectPayersFilterOptions(store.getState());
      expect(initialPayersFilters).toEqual(
        managePayersInitialState.payersFilterOptions
      );

      store.dispatch(setPayersStateFilter([mockedStates[0].abbreviation]));
      const updatedPayersFilters = selectPayersFilterOptions(store.getState());
      expect(updatedPayersFilters).toEqual({
        stateAbbrs: [mockedStates[0].abbreviation],
      });
      store.dispatch(resetPayersStateFilter());
      const resetedPayersFilters = selectPayersFilterOptions(store.getState());
      expect(resetedPayersFilters).toEqual(
        managePayersInitialState.payersFilterOptions
      );
    });
  });

  describe('selectors', () => {
    it('selectPayersList should return transformed Payers list with Payer Groups', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payers: [mockedInsurancePayer] })
      );

      fetchMock.mockOnceIf(
        new RegExp(PAYER_GROUPS_API_PATH),
        JSON.stringify({ payerGroups: mockedInsurancePayerGroups })
      );

      const store = setupTestStore();

      await store.dispatch(
        payerGroupsSlice.endpoints.getPayerGroups.initiate()
      );
      await store.dispatch(payersSlice.endpoints.getPayers.initiate());

      const fullPayersList = selectPayersList()(store.getState());

      expect(fullPayersList).toEqual({
        payers: [
          {
            ...mockedInsurancePayer,
            payerGroup: mockedInsurancePayerGroups[0],
            payerGroupId: undefined,
          },
        ],
      });
    });
  });
});
