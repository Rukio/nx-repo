import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { selectSelectedMarketId } from '../peerRankings';
import {
  Metrics,
  CareTeamRankingsState,
  CareTeamRankingsSortBy,
  ProfilePosition,
} from '../../types';
import { RootState } from '../../store';

export const PROVIDERS_PER_PAGE = '30';

export const DEFAULT_PAGE_NUMBER = 1;

export const CARE_TEAM_RANKINGS_KEY = 'careTeamRankings';

export const initialCareTeamRankingsState: CareTeamRankingsState = {
  searchText: '',
  page: DEFAULT_PAGE_NUMBER,
  tabSelected: Metrics.OnSceneTime,
  selectedPositionName: ProfilePosition.App,
};

export const careTeamRankingsSlice = createSlice({
  name: CARE_TEAM_RANKINGS_KEY,
  initialState: initialCareTeamRankingsState,
  reducers: {
    setSearchText: (
      state,
      action: PayloadAction<Pick<CareTeamRankingsState, 'searchText'>>
    ) => {
      state.searchText = action.payload.searchText;
      state.page = DEFAULT_PAGE_NUMBER;
    },
    setTabSelected: (
      state,
      action: PayloadAction<Pick<CareTeamRankingsState, 'tabSelected'>>
    ) => {
      state.tabSelected = action.payload.tabSelected;
      state.page = DEFAULT_PAGE_NUMBER;
    },
    setCurrentPage: (
      state,
      action: PayloadAction<Pick<CareTeamRankingsState, 'page'>>
    ) => {
      state.page = action.payload.page;
    },
    setSelectedPosition(
      state,
      action: PayloadAction<Pick<CareTeamRankingsState, 'selectedPositionName'>>
    ) {
      state.selectedPositionName = action.payload.selectedPositionName;
      state.page = DEFAULT_PAGE_NUMBER;

      if (
        state.tabSelected === Metrics.SurveyCapture &&
        state.selectedPositionName === ProfilePosition.App
      ) {
        state.tabSelected = Metrics.ChartClosure;
      } else if (
        state.tabSelected === Metrics.ChartClosure &&
        state.selectedPositionName === ProfilePosition.Dhmt
      ) {
        state.tabSelected = Metrics.SurveyCapture;
      }
    },
  },
});

export const selectCareTeamRankingsState = (
  state: Pick<RootState, 'careTeamRankings'>
) => state[CARE_TEAM_RANKINGS_KEY];

export const selectCareTeamRankingsParams = createSelector(
  [selectCareTeamRankingsState, selectSelectedMarketId],
  (state: CareTeamRankingsState, market) => {
    const sortBy = CareTeamRankingsSortBy[state.tabSelected];

    return {
      market_id: market.selectedMarketId,
      search_text: state.searchText,
      page: state.page.toString(),
      provider_job_title: state.selectedPositionName,
      sort_by: sortBy,
      per_page: PROVIDERS_PER_PAGE,
    };
  }
);

export const selectCareTeamRankingsTabSelected = createSelector(
  selectCareTeamRankingsState,
  (careTeamRankingsState) => careTeamRankingsState.tabSelected
);

export const selectSelectedPositionName = createSelector(
  selectCareTeamRankingsState,
  (careTeamRankingsState) => careTeamRankingsState.selectedPositionName
);

export const selectSearchText = createSelector(
  selectCareTeamRankingsState,
  (careTeamRankingsState) => careTeamRankingsState.searchText
);

export const {
  setSearchText,
  setTabSelected,
  setCurrentPage,
  setSelectedPosition,
} = careTeamRankingsSlice.actions;
