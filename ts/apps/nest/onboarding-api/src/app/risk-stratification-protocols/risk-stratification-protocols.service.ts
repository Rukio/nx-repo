import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

import {
  RiskStratificationProtocolSearchParam,
  StationRiskStratificationProtocolSearchParam,
  RiskStratificationProtocol,
  ProtocolWithQuestions,
} from '@*company-data-covered*/consumer-web-types';
import mapper from './risk-stratification-protocols.mapper';
import StationService from '../station/station.service';

@Injectable()
export default class RiskStratificationProtocolsService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private stationService: StationService
  ) {}

  /** Retrieves the base path for the Station service from the config service. */
  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  private async getCommonHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  async fetchAll(
    params: RiskStratificationProtocolSearchParam
  ): Promise<RiskStratificationProtocol> {
    const stationQuery: StationRiskStratificationProtocolSearchParam =
      mapper.SearchRSPToStationRSP(params);
    const url = `${this.basePath}/api/risk_stratification_protocols`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
        params: stationQuery,
      })
    );
    const data: RiskStratificationProtocol = mapper.StationRSPToRSP(
      response.data
    );

    return data;
  }

  async fetch(
    params: RiskStratificationProtocolSearchParam,
    protocolId: number | string
  ): Promise<ProtocolWithQuestions> {
    return this.stationService.fetchRiskStratificationProtocol(
      params,
      protocolId
    );
  }
}
