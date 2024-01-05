import { RootState } from '../../store';
import {
  DEFAULT_PAGE,
  PROVIDER_SHIFTS_KEY,
  initialProviderShiftsTableState,
  providerShiftsTableSlice,
  selectProviderShiftsPage,
  selectProviderShiftsTimestamp,
  setProviderShiftsPage,
  setProviderShiftsTimestamp,
} from './providerShiftsTableSlice.slice';
import { setupTestStore } from '../../../testUtils';

const testPage = 2;
const testTimestamp = '2023-06-30T21:55:51.355Z';

const testState: Pick<RootState, 'providerShiftsTable'> = {
  [PROVIDER_SHIFTS_KEY]: {
    page: testPage,
    fromTimestamp: testTimestamp,
  },
};

describe('ProviderShiftsTable slice', () => {
  it('should handle initial state', () => {
    const result = providerShiftsTableSlice.reducer(undefined, {
      type: undefined,
    });
    expect(result).toEqual(initialProviderShiftsTableState);
  });

  describe('reducer', () => {
    it('should handle set Page', () => {
      const store = setupTestStore();

      const initialPage = selectProviderShiftsPage(store.getState());
      expect(initialPage).toEqual(initialProviderShiftsTableState.page);

      store.dispatch(setProviderShiftsPage({ page: testPage }));
      const updatedPage = selectProviderShiftsPage(store.getState());
      expect(updatedPage).toEqual(testPage);
    });

    it('should handle setting Timestamp and resetting Page to 1', () => {
      const store = setupTestStore();

      const initialTimestamp = selectProviderShiftsTimestamp(store.getState());
      expect(initialTimestamp).toEqual(
        initialProviderShiftsTableState.fromTimestamp
      );

      store.dispatch(
        setProviderShiftsTimestamp({ fromTimestamp: testTimestamp })
      );
      const updatedTimestamp = selectProviderShiftsTimestamp(store.getState());
      expect(updatedTimestamp).toEqual(testTimestamp);
      const updatedPage = selectProviderShiftsPage(store.getState());
      expect(updatedPage).toEqual(DEFAULT_PAGE);
    });
  });

  describe('selectors', () => {
    it('should select Page', () => {
      const result = selectProviderShiftsPage(testState);
      expect(result).toEqual(testPage);
    });

    it('should select Timestamp', () => {
      const result = selectProviderShiftsTimestamp(testState);
      expect(result).toEqual(testTimestamp);
    });
  });
});
