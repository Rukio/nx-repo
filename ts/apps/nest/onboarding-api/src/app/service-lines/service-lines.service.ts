import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ServiceLineQuestionResponse,
  ServiceLine,
} from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import {
  CreateServiceLineQuestionResponseDto,
  UpdateServiceLineQuestionResponseDto,
} from './dto/service-line-question.dto';
import mapper from './service-lines.mapper';

@Injectable()
export default class ServiceLinesService {
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

  async fetchAll(careRequestId: number): Promise<ServiceLine[] | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/possible_service_lines`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: ServiceLine[] = response.data.map(
      mapper.StationServiceLineToServiceLine
    );

    return data;
  }

  async fetch(
    careRequestId: number
  ): Promise<ServiceLineQuestionResponse | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/service_line_question_response`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: ServiceLineQuestionResponse =
      mapper.StationServiceLineQuestionResponseToServiceLineQuestionResponse(
        response.data
      );

    return data;
  }

  async create(
    careRequestId: number,
    payload: CreateServiceLineQuestionResponseDto
  ): Promise<ServiceLineQuestionResponse | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/service_line_question_response`;
    const stationPayload =
      mapper.ServiceLineQuestionResponseToStationServiceLineQuestionResponse(
        payload
      );

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        {
          service_line_question_response: stationPayload,
        },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: ServiceLineQuestionResponse =
      mapper.StationServiceLineQuestionResponseToServiceLineQuestionResponse(
        response.data
      );

    return data;
  }

  async update(
    careRequestId: number,
    payload: UpdateServiceLineQuestionResponseDto
  ): Promise<ServiceLineQuestionResponse | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/service_line_question_response`;
    const stationPayload =
      mapper.ServiceLineQuestionResponseToStationServiceLineQuestionResponse(
        payload
      );
    const response = await lastValueFrom(
      this.httpService.put(
        url,
        {
          service_line_question_response: stationPayload,
        },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: ServiceLineQuestionResponse =
      mapper.StationServiceLineQuestionResponseToServiceLineQuestionResponse(
        response.data
      );

    return data;
  }

  async delete(careRequestId: number): Promise<{ success: boolean } | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/service_line_question_response`;
    await lastValueFrom(
      this.httpService.delete(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    return { success: true };
  }

  async get911ServiceLine(): Promise<ServiceLine | null> {
    const url = `${this.basePath}/api/service_lines?is_911=true`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const serviceLine = response.data[0];
    if (!serviceLine) {
      return null;
    }

    return mapper.StationServiceLineToServiceLine(serviceLine);
  }
}
