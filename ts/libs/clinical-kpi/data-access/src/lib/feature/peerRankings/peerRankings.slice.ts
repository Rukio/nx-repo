import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '../../../util/localStorage';

export const PEER_RANKINGS_KEY = 'peerRankings';

export enum PeerRankingsLocalStorageKeys {
  SelectedMarketId = 'selectedMarketId',
}

export interface PeerRankingsState {
  selectedMarketId?: string;
}

type RootState = unknown & {
  [PEER_RANKINGS_KEY]: PeerRankingsState;
};

export const initialPeerRankingsState: PeerRankingsState = {
  selectedMarketId: getLocalStorageItem(
    PeerRankingsLocalStorageKeys.SelectedMarketId,
    undefined
  ),
};

export const peerRankingsSlice = createSlice({
  name: PEER_RANKINGS_KEY,
  initialState: initialPeerRankingsState,
  reducers: {
    setMarketId(
      state,
      action: PayloadAction<Pick<PeerRankingsState, 'selectedMarketId'>>
    ) {
      const { selectedMarketId } = action.payload;
      state.selectedMarketId = selectedMarketId;
      setLocalStorageItem(
        PeerRankingsLocalStorageKeys.SelectedMarketId,
        selectedMarketId
      );
    },
  },
});

const selectPeerRankingsState = (state: RootState) => state[PEER_RANKINGS_KEY];

export const selectSelectedMarketId = createSelector(
  selectPeerRankingsState,
  ({ selectedMarketId }) => ({
    selectedMarketId,
  })
);

export const { setMarketId } = peerRankingsSlice.actions;
