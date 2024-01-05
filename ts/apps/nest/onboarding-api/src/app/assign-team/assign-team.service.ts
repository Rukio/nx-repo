import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  AssignTeamParam,
  StationAssignTeamParam,
  EtaRange,
  StationEtaRange,
} from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import mapper from './assign-team.mapper';
import stationModuleMapper from '../station/station.mapper';
import EtaRangeQueryDTO from './dto/assign-team-eta-range.dto';

@Injectable()
export default class AssignTeamService {
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

  async update(
    careRequestId: number | string,
    payload: AssignTeamParam
  ): Promise<{ success: boolean } | null> {
    const assingTeamPayload: StationAssignTeamParam =
      mapper.AssignTeamParamToStationAssignTeamParam(payload);

    const url = `${this.basePath}/api/care_requests/${careRequestId}/assign_team`;

    await lastValueFrom(
      this.httpService.patch(url, assingTeamPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    return { success: true };
  }

  async createEta(
    careRequestId: number,
    payload: EtaRangeQueryDTO
  ): Promise<EtaRange> {
    const stationParam: StationEtaRange =
      stationModuleMapper.EtaRangeToStationEtaRange(payload);

    const url = `${this.basePath}/api/care_requests/${careRequestId}/eta_ranges.json`;

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        {
          eta_range: stationParam,
        },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    return stationModuleMapper.StationEtaRangeToEtaRange(response.data);
  }

  async removeAssignment(id: string): Promise<void> {
    const url = `${this.basePath}/api/logistics/assignments/${id}`;

    await lastValueFrom(
      this.httpService.delete(url, {
        headers: await this.getCommonHeaders(),
      })
    );
  }
}
