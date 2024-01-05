import { Injectable } from '@nestjs/common';
import {
  StationSecondaryScreening,
  SecondaryScreening,
} from '@*company-data-covered*/consumer-web-types';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import mapper from './secondary-screening.mapper';

@Injectable()
export default class SecondaryScreeningService {
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

  async create(
    careRequestId: string,
    payload: Omit<SecondaryScreening, 'id' | 'careRequestId'>
  ): Promise<SecondaryScreening> {
    const stationPayload: StationSecondaryScreening =
      mapper.SecondaryScreeningToStationSecondaryScreening(payload);

    const url = `${this.basePath}/api/care_requests/${careRequestId}/secondary_screenings`;

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        { secondary_screening: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: SecondaryScreening =
      mapper.StationSecondaryScreeningToSecondaryScreening(response.data);

    return data;
  }

  async fetchAll(careRequestId: string): Promise<SecondaryScreening[]> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/secondary_screenings`;

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: SecondaryScreening[] = response.data.map(
      (s: StationSecondaryScreening) =>
        mapper.StationSecondaryScreeningToSecondaryScreening(s)
    );

    return data;
  }

  async update(
    careRequestId: string,
    id: string,
    payload: Omit<SecondaryScreening, 'id' | 'careRequestId'>
  ): Promise<SecondaryScreening> {
    const stationPayload: StationSecondaryScreening =
      mapper.SecondaryScreeningToStationSecondaryScreening(payload);

    const url = `${this.basePath}/api/care_requests/${careRequestId}/secondary_screenings/${id}`;

    const response = await lastValueFrom(
      this.httpService.put(
        url,
        { secondary_screening: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: SecondaryScreening =
      mapper.StationSecondaryScreeningToSecondaryScreening(response.data);

    return data;
  }

  async remove(
    careRequestId: string,
    id: string
  ): Promise<{ success: boolean }> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/secondary_screenings/${id}`;
    await lastValueFrom(
      this.httpService.delete(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    return { success: true };
  }
}
