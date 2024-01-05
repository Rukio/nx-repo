import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  StationEdRefusalQuestionnaire,
  EdRefusalQuestionnaire,
} from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import mapper from './ed-refusal-questionnaires.mapper';

@Injectable()
export default class EdRefusalQuestionnairesService {
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
    careRequestId: number | string,
    payload: EdRefusalQuestionnaire
  ): Promise<EdRefusalQuestionnaire> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/ed_refusal_questionnaires`;
    const stationPayload: StationEdRefusalQuestionnaire =
      mapper.EdRefusalQuestionnaireToStationEdRefusalQuestionnaire(payload);

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        { ed_refusal_questionnaire: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );
    const data: EdRefusalQuestionnaire =
      mapper.StationEdRefusalQuestionnaireToEdRefusalQuestionnaire(
        response.data
      );

    return data;
  }

  async fetchAll(
    careRequestId: number | string
  ): Promise<EdRefusalQuestionnaire[]> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/ed_refusal_questionnaires`;

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: EdRefusalQuestionnaire[] = response.data.map(
      (srq: StationEdRefusalQuestionnaire) =>
        mapper.StationEdRefusalQuestionnaireToEdRefusalQuestionnaire(srq)
    );

    return data;
  }

  async update(
    careRequestId: number | string,
    id: number | string,
    payload: EdRefusalQuestionnaire
  ): Promise<EdRefusalQuestionnaire> {
    const stationPayload: StationEdRefusalQuestionnaire =
      mapper.EdRefusalQuestionnaireToStationEdRefusalQuestionnaire(payload);
    const url = `${this.basePath}/api/care_requests/${careRequestId}/ed_refusal_questionnaires/${id}`;

    const response = await lastValueFrom(
      this.httpService.put(
        url,
        { ed_refusal_questionnaire: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );
    const data: EdRefusalQuestionnaire =
      mapper.StationEdRefusalQuestionnaireToEdRefusalQuestionnaire(
        response.data
      );

    return data;
  }
}
