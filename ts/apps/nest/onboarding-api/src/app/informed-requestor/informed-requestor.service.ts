import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  StationInformedRequestor,
  InformedRequestor,
} from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import mapper from './informed-requestor.mapper';

@Injectable()
export default class InformedRequestorsService {
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

  async create(payload: InformedRequestor): Promise<InformedRequestor> {
    const url = `${this.basePath}/api/care_requests/${payload.careRequestId}/informed_requestor`;
    const stationPayload: { informer_questions: StationInformedRequestor } =
      mapper.InformedRequestorToStationInformerRequestor(payload);

    if (!payload.careRequestId) {
      throw new HttpException('care request id is required', 500);
    }

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        { informed_requestor: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );
    const data: InformedRequestor =
      mapper.StationInformedRequestorResponseToInformerRequestor(response.data);

    return data;
  }

  async update(payload: InformedRequestor): Promise<InformedRequestor> {
    const url = `${this.basePath}/api/care_requests/${payload.careRequestId}/informed_requestor`;
    const stationPayload: { informer_questions: StationInformedRequestor } =
      mapper.InformedRequestorToStationInformerRequestor(payload);

    if (!payload.careRequestId) {
      throw new HttpException('care request id is required', 500);
    }

    const response = await lastValueFrom(
      this.httpService.patch(
        url,
        { informed_requestor: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );
    const data: InformedRequestor =
      mapper.StationInformedRequestorResponseToInformerRequestor(response.data);

    return data;
  }

  async fetch(careRequestId: number): Promise<InformedRequestor | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/informed_requestor`;

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    if (response.data) {
      const mappedData: InformedRequestor =
        mapper.StationInformedRequestorResponseToInformerRequestor(
          response.data
        );

      return mappedData;
    }

    return response.data;
  }
}
