import { HttpModule, HttpService } from '@nestjs/axios';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  ShiftTeam,
  StationAssignableShiftTeams,
  StationShiftTeam,
} from '@*company-data-covered*/consumer-web-types';
import { of } from 'rxjs';
import { CacheConfigService } from '../../common/cache.config.service';
import ShiftTeamsService from '../shift-teams.service';
import mapper from '../shift-teams.mapper';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  MOCK_SHIFT_TEAM,
  SHIFT_TEAM_PARAMS,
  SHIFT_TEAM_PARAMS_WITH_CARE_REQUEST,
  SHIFT_TEAM_PARAMS_WITH_MARKET_IDS,
  MOCK_ASSIGNABLE_SHIFT_TEAMS,
  MOCK_STATION_ASSIGNABLE_SHIFT_TEAMS,
  MOCK_STATION_SHIFT_TEAM,
} from './mocks/shift-teams.mock';

describe(`${ShiftTeamsService.name}`, () => {
  let app: INestApplication;
  let shiftTeamsService: ShiftTeamsService;
  let httpService: HttpService;
  const spyMapperQueryParams = jest.spyOn(
    mapper,
    'SearchShiftTeamToStationSearchShiftTeam'
  );
  const spyMapperResponse = jest.spyOn(mapper, 'StationShiftTeamsToShiftTeams');

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ShiftTeamsService],
      imports: [
        HttpModule,
        ConfigModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();
    httpService = module.get<HttpService>(HttpService);
    shiftTeamsService = module.get<ShiftTeamsService>(ShiftTeamsService);

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    spyMapperQueryParams.mockClear();
    spyMapperResponse.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${ShiftTeamsService.prototype.search.name}`, () => {
    const stationShiftTeamsMock: StationShiftTeam[] = [MOCK_STATION_SHIFT_TEAM];
    const shiftTeamsMock: ShiftTeam[] = [MOCK_SHIFT_TEAM];

    it('should return list of shift teams when marketId is provided', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(stationShiftTeamsMock))
        );
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await shiftTeamsService.search(SHIFT_TEAM_PARAMS);
      expect(response).toEqual(shiftTeamsMock);
    });

    it('should return list of shift teams with marketIds', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(stationShiftTeamsMock))
        );
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await shiftTeamsService.search(
        SHIFT_TEAM_PARAMS_WITH_MARKET_IDS
      );
      expect(response).toEqual(shiftTeamsMock);
    });

    it(`should throw bad request exception when query doesn't have ids`, async () => {
      await expect(async () => {
        await shiftTeamsService.search({});
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe(`${ShiftTeamsService.prototype.fetch.name}`, () => {
    const mockResult: StationAssignableShiftTeams =
      MOCK_STATION_ASSIGNABLE_SHIFT_TEAMS;

    it('should return list of assignable shift teams', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(mockResult)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await shiftTeamsService.fetch(
        SHIFT_TEAM_PARAMS_WITH_CARE_REQUEST
      );
      expect(response).toEqual(MOCK_ASSIGNABLE_SHIFT_TEAMS);
    });

    it(`should throw bad request exception when query doesn't have careRequestId`, async () => {
      await expect(async () => {
        await shiftTeamsService.fetch({});
      }).rejects.toThrow(BadRequestException);
    });

    it(`should throw bad request exception when careRequestId is empty string`, async () => {
      await expect(async () => {
        await shiftTeamsService.fetch({ careRequestId: '' });
      }).rejects.toThrow(BadRequestException);
    });
  });
});
