import { RootState } from '../../store';
import { setupTestStore } from '../../../testUtils';
import {
  INDIVIDUAL_PERFORMANCE_POSITION_KEY,
  IndividualPerformancePositionState,
  setProviderPosition,
  selectIndividualPerformancePosition,
  individualPerformancePositionSlice,
  initialIndividualPerformancePositionState,
} from './individualPerformancePosition';
import { ProfilePosition } from '../../types';

const initialState: IndividualPerformancePositionState = {
  position: ProfilePosition.App,
};

const testState: Pick<RootState, 'individualPerformancePosition'> = {
  [INDIVIDUAL_PERFORMANCE_POSITION_KEY]: initialState,
};

describe('IndividualPerformancePosition slice', () => {
  it('should handle initial state', () => {
    const result = individualPerformancePositionSlice.reducer(undefined, {
      type: undefined,
    });
    expect(result).toEqual(initialIndividualPerformancePositionState);
  });

  describe('reducer', () => {
    it('should handle set Page', () => {
      const store = setupTestStore();

      const initialPosition = selectIndividualPerformancePosition(
        store.getState()
      );
      expect(initialPosition).toEqual(
        initialIndividualPerformancePositionState.position
      );

      store.dispatch(setProviderPosition(initialState.position));
      const updatedPosition = selectIndividualPerformancePosition(
        store.getState()
      );

      expect(updatedPosition).toEqual(initialState.position);
    });

    it('should handle set SearchText', () => {
      const store = setupTestStore();

      const position = selectIndividualPerformancePosition(store.getState());
      expect(position).toEqual(
        initialIndividualPerformancePositionState.position
      );

      store.dispatch(setProviderPosition(initialState.position));
      const updatedPosition = selectIndividualPerformancePosition(
        store.getState()
      );

      expect(updatedPosition).toEqual(initialState.position);
    });
  });

  describe('selectors', () => {
    it('should select position', () => {
      const result = selectIndividualPerformancePosition(testState);
      expect(result).toEqual(initialState.position);
    });
  });
});
