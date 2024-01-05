import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Protocol } from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import mapper from './symptoms.mapper';

@Injectable()
export default class SymptomsService {
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

  async fetchAll(): Promise<Protocol[]> {
    const url = `${this.basePath}/admin/risk_stratification/protocols?search=published`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: Protocol[] = response.data.map(mapper.StationSymptomToSymptom);

    return data;
  }
}
