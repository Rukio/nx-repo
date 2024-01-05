import { RootState } from '../../store';
import { setupTestStore } from '../../../testUtils';
import {
  PROVIDER_VISITS_TABLE_KEY,
  ProviderVisitsTableState,
  initialProviderVisitsTableState,
  providerVisitsTableSlice,
  selectProviderVisitsSearchFilters,
  setProviderVisitsIsAbxPrescribed,
  setProviderVisitsIsEscalated,
  setProviderVisitsPage,
  setProviderVisitsSearchText,
} from './providerVisitsTableSlice.slice';

const initialState: ProviderVisitsTableState = {
  page: 1,
  searchText: 'John',
  isAbxPrescribed: true,
  isEscalated: true,
};

const testState: Pick<RootState, 'providerVisitsTable'> = {
  [PROVIDER_VISITS_TABLE_KEY]: initialState,
};

describe('ProviderVisitsTable slice', () => {
  it('should handle initial state', () => {
    const result = providerVisitsTableSlice.reducer(undefined, {
      type: undefined,
    });
    expect(result).toEqual(initialProviderVisitsTableState);
  });

  describe('reducer', () => {
    it('should handle set Page', () => {
      const store = setupTestStore();

      const { page: initialPage } = selectProviderVisitsSearchFilters(
        store.getState()
      );
      expect(initialPage).toEqual(initialProviderVisitsTableState.page);

      store.dispatch(setProviderVisitsPage({ page: initialState.page }));
      const { page: updatedPage } = selectProviderVisitsSearchFilters(
        store.getState()
      );

      expect(updatedPage).toEqual(initialState.page);
    });

    it('should handle set SearchText', () => {
      const store = setupTestStore();

      const { searchText: initialSearchText } =
        selectProviderVisitsSearchFilters(store.getState());
      expect(initialSearchText).toEqual(
        initialProviderVisitsTableState.searchText
      );

      store.dispatch(
        setProviderVisitsSearchText({ searchText: initialState.searchText })
      );
      const { searchText: updatedSearchText, page: updatedPage } =
        selectProviderVisitsSearchFilters(store.getState());

      expect(updatedSearchText).toEqual(initialState.searchText);
      expect(updatedPage).toEqual(initialState.page);
    });

    it('should handle set isAbxPrescribed', () => {
      const store = setupTestStore();

      const { isAbxPrescribed: initialIsAbxPrescribed } =
        selectProviderVisitsSearchFilters(store.getState());
      expect(initialIsAbxPrescribed).toEqual(
        initialProviderVisitsTableState.isAbxPrescribed
      );

      store.dispatch(
        setProviderVisitsIsAbxPrescribed({
          isAbxPrescribed: initialState.isAbxPrescribed,
        })
      );
      const { isAbxPrescribed: updatedIsAbxPrescribed } =
        selectProviderVisitsSearchFilters(store.getState());

      expect(updatedIsAbxPrescribed).toEqual(initialState.isAbxPrescribed);
    });

    it('should handle set isEscalated', () => {
      const store = setupTestStore();

      const { isEscalated: initialIsEscalated } =
        selectProviderVisitsSearchFilters(store.getState());
      expect(initialIsEscalated).toEqual(
        initialProviderVisitsTableState.isEscalated
      );

      store.dispatch(
        setProviderVisitsIsEscalated({
          isEscalated: initialState.isEscalated,
        })
      );
      const { isEscalated: updatedIsEscalated } =
        selectProviderVisitsSearchFilters(store.getState());

      expect(updatedIsEscalated).toEqual(initialState.isEscalated);
    });
  });

  describe('selectors', () => {
    it('should select Filters', () => {
      const result = selectProviderVisitsSearchFilters(testState);
      expect(result).toEqual(initialState);
    });
  });
});
