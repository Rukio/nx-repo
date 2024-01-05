import { RootState } from '../../store';
import {
  peerRankingsSlice,
  PEER_RANKINGS_KEY,
  initialPeerRankingsState,
  setMarketId,
  selectSelectedMarketId,
} from './peerRankings.slice';

const testSelectedMarketId = '198';

const testState: Pick<RootState, 'peerRankings'> = {
  [PEER_RANKINGS_KEY]: {
    selectedMarketId: testSelectedMarketId,
  },
};

describe('PeerRankings slice', () => {
  it('should handle initial state', () => {
    const result = peerRankingsSlice.reducer(undefined, {
      type: undefined,
    });
    expect(result).toEqual(initialPeerRankingsState);
  });

  describe('reducer', () => {
    it('should handle setMarketId', () => {
      const result = peerRankingsSlice.reducer(
        undefined,
        setMarketId({ selectedMarketId: testSelectedMarketId })
      );
      expect(result).toEqual({
        ...initialPeerRankingsState,
        selectedMarketId: testSelectedMarketId,
      });
    });
  });

  describe('selectors', () => {
    it('should select selectedMarketId', () => {
      const result = selectSelectedMarketId(testState);
      expect(result).toEqual({ selectedMarketId: testSelectedMarketId });
    });
  });
});
