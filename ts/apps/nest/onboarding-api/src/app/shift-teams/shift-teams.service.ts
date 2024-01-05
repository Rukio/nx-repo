import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  AssignableShiftTeam,
  ShiftTeam,
} from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import mapper from './shift-teams.mapper';
import ShiftTeamSearchDto from './dto/shift-team-search.dto';

@Injectable()
export default class ShiftTeamsService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  /** Retrieves the base path for the Station service from the config service. */
  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  /** Retrieves an object with all of the headers required to communicate with Station APIs. Formatted for Axios request configuration. */
  private async getCommonHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  async fetch(query: ShiftTeamSearchDto): Promise<AssignableShiftTeam[]> {
    const stationParams =
      mapper.ShiftTeamSearchParamToStationGetAssignableShiftTeam(query);
    const url = `${this.basePath}/api/shift_teams/assignable`;

    if (!stationParams.care_request_id) {
      throw new BadRequestException('Make sure the query sent is correct.');
    }

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
        params: stationParams,
      })
    );
    const data: AssignableShiftTeam[] =
      mapper.StationAssignableShiftTeamsToShiftTeams(response.data);

    return data;
  }

  async search(query: ShiftTeamSearchDto) {
    const stationParams = mapper.SearchShiftTeamToStationSearchShiftTeam(query);
    const url = `${this.basePath}/api/shift_teams`;

    if (!Object.keys(stationParams).length) {
      throw new BadRequestException('Make sure the query sent is correct.');
    }

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
        params: stationParams,
      })
    );
    const data: ShiftTeam[] = response.data.map(
      mapper.StationShiftTeamsToShiftTeams
    );

    return data;
  }
}
