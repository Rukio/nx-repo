import mapper from '../shift-teams.mapper';
import {
  SHIFT_TEAM_PARAMS,
  SHIFT_TEAM_PARAMS_WITH_MARKET_IDS,
  SHIFT_TEAM_PARAMS_WITH_STRING_MARKET_IDS,
  SHIFT_TEAM_PARAMS_WITHOUT_IDS,
  SHIFT_TEAM_PARAMS_WITH_ARRAY_OF_IDS,
  SHIFT_TEAM_PARAMS_WITH_IDS,
  STATION_SHIFT_TEAM_PARAMS,
  STATION_SHIFT_TEAM_PARAMS_WITH_MARKET_IDS,
  STATION_SHIFT_TEAM_PARAMS_WITH_STRING_MARKET_IDS,
  STATION_SHIFT_TEAM_PARAMS_WITH_ARRAY_OF_IDS,
  STATION_SHIFT_TEAM_PARAMS_WITH_IDS,
  MOCK_STATION_ASSIGNABLE_SHIFT_TEAMS,
  MOCK_ASSIGNABLE_SHIFT_TEAMS,
  SHIFT_TEAM_ASSIGNABLE_FETCH_PARAMS,
  STATION_SHIFT_TEAM_ASSIGNABLE_FETCH_PARAMS,
} from './mocks/shift-teams.mock';

describe('Shift teams mapper', () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  describe(`${mapper.SearchShiftTeamToStationSearchShiftTeam.name}`, () => {
    it('should return list of shift teams with marketIds', async () => {
      const mappedResponse =
        mapper.SearchShiftTeamToStationSearchShiftTeam(SHIFT_TEAM_PARAMS);
      expect(mappedResponse).toEqual(STATION_SHIFT_TEAM_PARAMS);
    });

    it('should return list of shift teams with array of marketIds', async () => {
      const mappedResponse = mapper.SearchShiftTeamToStationSearchShiftTeam(
        SHIFT_TEAM_PARAMS_WITH_MARKET_IDS
      );
      expect(mappedResponse).toEqual(STATION_SHIFT_TEAM_PARAMS_WITH_MARKET_IDS);
    });

    it('should return list of shift teams with array of marketIds', async () => {
      const mappedResponse = mapper.SearchShiftTeamToStationSearchShiftTeam(
        SHIFT_TEAM_PARAMS_WITH_STRING_MARKET_IDS
      );
      expect(mappedResponse).toEqual(
        STATION_SHIFT_TEAM_PARAMS_WITH_STRING_MARKET_IDS
      );
    });

    it('should return list of shift teams without ids', async () => {
      const mappedResponse = mapper.SearchShiftTeamToStationSearchShiftTeam(
        SHIFT_TEAM_PARAMS_WITHOUT_IDS
      );
      expect(mappedResponse).toEqual({});
    });

    it('should return list of shift teams with marketIds', async () => {
      const mappedResponse =
        mapper.SearchShiftTeamToStationSearchShiftTeam(SHIFT_TEAM_PARAMS);
      expect(mappedResponse).toEqual(STATION_SHIFT_TEAM_PARAMS);
    });

    it('should return list of shift teams with ids', async () => {
      const mappedResponse = mapper.SearchShiftTeamToStationSearchShiftTeam(
        SHIFT_TEAM_PARAMS_WITH_IDS
      );
      expect(mappedResponse).toEqual(STATION_SHIFT_TEAM_PARAMS_WITH_IDS);
    });

    it('should return list of shift teams with array of ids', async () => {
      const mappedResponse = mapper.SearchShiftTeamToStationSearchShiftTeam(
        SHIFT_TEAM_PARAMS_WITH_ARRAY_OF_IDS
      );
      expect(mappedResponse).toEqual(
        STATION_SHIFT_TEAM_PARAMS_WITH_ARRAY_OF_IDS
      );
    });
  });

  describe(`${mapper.StationAssignableShiftTeamsToShiftTeams.name}`, () => {
    it('should return list of assignable shift teams', async () => {
      const mappedResponse = mapper.StationAssignableShiftTeamsToShiftTeams(
        MOCK_STATION_ASSIGNABLE_SHIFT_TEAMS
      );
      expect(mappedResponse).toEqual(MOCK_ASSIGNABLE_SHIFT_TEAMS);
    });
  });

  describe(`${mapper.ShiftTeamSearchParamToStationGetAssignableShiftTeam.name}`, () => {
    it('should return station params for fetch assignable shift teams', async () => {
      const mappedResponse =
        mapper.ShiftTeamSearchParamToStationGetAssignableShiftTeam(
          SHIFT_TEAM_ASSIGNABLE_FETCH_PARAMS
        );
      expect(mappedResponse).toEqual(
        STATION_SHIFT_TEAM_ASSIGNABLE_FETCH_PARAMS
      );
    });
  });
});
