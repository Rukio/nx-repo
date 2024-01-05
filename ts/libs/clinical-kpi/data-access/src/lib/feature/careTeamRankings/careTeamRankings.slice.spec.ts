import {
  careTeamRankingsSlice,
  initialCareTeamRankingsState,
  selectCareTeamRankingsParams,
  selectCareTeamRankingsState,
  selectCareTeamRankingsTabSelected,
  selectSelectedPositionName,
  setCurrentPage,
  setSelectedPosition,
  setSearchText,
  setTabSelected,
  DEFAULT_PAGE_NUMBER,
  selectSearchText,
  PROVIDERS_PER_PAGE,
} from './careTeamRankings.slice';
import { selectSelectedMarketId } from '../peerRankings';
import { setupTestStore } from '../../../testUtils';
import {
  CareTeamRankingsParams,
  CareTeamRankingsSortBy,
  Metrics,
  ProfilePosition,
} from '../../types';

describe('careTeamRankings slice', () => {
  it('should handle initial state', () => {
    const result = careTeamRankingsSlice.reducer(undefined, {
      type: undefined,
    });
    expect(result).toEqual(initialCareTeamRankingsState);
  });

  it('should return careTeamRankings state', () => {
    const store = setupTestStore();
    const initialState = selectCareTeamRankingsState(store.getState());
    expect(initialState).toEqual(initialCareTeamRankingsState);
  });
});

describe('selectors', () => {
  it('should get tabSelected', () => {
    const store = setupTestStore();

    const initialTab = selectCareTeamRankingsTabSelected(store.getState());
    expect(initialTab).toEqual(initialCareTeamRankingsState.tabSelected);

    store.dispatch(setTabSelected({ tabSelected: Metrics.ChartClosure }));
    const updatedTabSelected = selectCareTeamRankingsTabSelected(
      store.getState()
    );
    expect(updatedTabSelected).toEqual(Metrics.ChartClosure);
  });

  it('should get PositionName', () => {
    const store = setupTestStore();

    const initialPositionName = selectSelectedPositionName(store.getState());
    expect(initialPositionName).toEqual(
      initialCareTeamRankingsState.selectedPositionName
    );

    store.dispatch(
      setSelectedPosition({ selectedPositionName: ProfilePosition.Dhmt })
    );
    const updatedPositionName = selectSelectedPositionName(store.getState());
    expect(updatedPositionName).toEqual(ProfilePosition.Dhmt);
  });

  it('should get CareTeamRankingsParams', () => {
    const mockCareTeamRankingsParams: CareTeamRankingsParams = {
      market_id: undefined,
      page: '1',
      search_text: '',
      provider_job_title: ProfilePosition.App,
      sort_by: CareTeamRankingsSortBy.OnSceneTime,
      per_page: PROVIDERS_PER_PAGE,
    };

    const store = setupTestStore();
    selectSelectedMarketId(store.getState());
    const initialCareTeamRankingsParams = selectCareTeamRankingsParams(
      store.getState()
    );
    expect(initialCareTeamRankingsParams).toEqual(mockCareTeamRankingsParams);
  });

  it('should select search text', () => {
    const searchText = 'John';
    const store = setupTestStore();

    const initialSearchText = selectSearchText(store.getState());
    expect(initialSearchText).toEqual(initialCareTeamRankingsState.searchText);

    store.dispatch(setSearchText({ searchText }));
    const updatedPositionName = selectSearchText(store.getState());
    expect(updatedPositionName).toEqual(searchText);
  });
});

describe('reducers', () => {
  it('should handle setSearchText', () => {
    const result = careTeamRankingsSlice.reducer(
      undefined,
      setSearchText({ searchText: 'some word' })
    );
    expect(result).toEqual({
      ...initialCareTeamRankingsState,
      searchText: 'some word',
      page: DEFAULT_PAGE_NUMBER,
    });
  });

  it('should handle setTabSelected', () => {
    const result = careTeamRankingsSlice.reducer(
      undefined,
      setTabSelected({ tabSelected: Metrics.SurveyCapture })
    );
    expect(result).toEqual({
      ...initialCareTeamRankingsState,
      tabSelected: Metrics.SurveyCapture,
      page: DEFAULT_PAGE_NUMBER,
    });
  });

  it('should handle setCurrentPage', () => {
    const result = careTeamRankingsSlice.reducer(
      undefined,
      setCurrentPage({ page: 2 })
    );
    expect(result).toEqual({
      ...initialCareTeamRankingsState,
      page: 2,
    });
  });

  it('should handle setSelectedPosition', () => {
    const result = careTeamRankingsSlice.reducer(
      undefined,
      setSelectedPosition({ selectedPositionName: ProfilePosition.Dhmt })
    );
    expect(result).toEqual({
      ...initialCareTeamRankingsState,
      selectedPositionName: ProfilePosition.Dhmt,
      page: DEFAULT_PAGE_NUMBER,
    });
  });

  it.each([
    {
      initialTabSelected: Metrics.ChartClosure,
      initialPosition: ProfilePosition.App,
      selectedPositionName: ProfilePosition.Dhmt,
      expectedTab: Metrics.SurveyCapture,
    },
    {
      initialTabSelected: Metrics.SurveyCapture,
      initialPosition: ProfilePosition.Dhmt,
      selectedPositionName: ProfilePosition.App,
      expectedTab: Metrics.ChartClosure,
    },
    {
      initialTabSelected: Metrics.OnSceneTime,
      initialPosition: ProfilePosition.App,
      selectedPositionName: ProfilePosition.Dhmt,
      expectedTab: Metrics.OnSceneTime,
    },
    {
      initialTabSelected: Metrics.NPS,
      initialPosition: ProfilePosition.App,
      selectedPositionName: ProfilePosition.Dhmt,
      expectedTab: Metrics.NPS,
    },
  ])(
    'should handle $initialTabSelected tab change to $expectedTab on position change',
    ({
      initialTabSelected,
      initialPosition,
      selectedPositionName,
      expectedTab,
    }) => {
      const store = setupTestStore({
        careTeamRankings: {
          ...initialCareTeamRankingsState,
          tabSelected: initialTabSelected,
          selectedPositionName: initialPosition,
        },
      });

      store.dispatch(setSelectedPosition({ selectedPositionName }));

      const updatedTabSelected = selectCareTeamRankingsTabSelected(
        store.getState()
      );
      expect(updatedTabSelected).toEqual(expectedTab);
    }
  );
});
