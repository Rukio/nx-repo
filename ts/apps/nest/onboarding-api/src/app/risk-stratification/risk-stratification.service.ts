import { stringify } from 'query-string';
import {
  RSTimeSensitiveAnswerEventBody,
  TimeSensitiveAnswerEvent,
  TimeSensitiveAnswerEventBody,
  TimeSensitiveScreeningResultBody,
  RSTimeSensitiveScreeningResultBody,
  TimeSensitiveQuestion,
  TimeSensitiveScreeningResultResponse,
  SearchSymptomAliasesResponse,
  CareRequestSymptomsBody,
  SearchSymptomAliasesParams,
} from '@*company-data-covered*/consumer-web-types';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

import { AuthService } from '@*company-data-covered*/nest/auth';
import mapper from './risk-stratification.mapper';

@Injectable()
export default class RiskStratificationService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  get basePath() {
    return `${this.configService.get('RISK_STRAT_SERVICE_URL')}`;
  }

  private async getCommonHeaders(
    authToken?: string
  ): Promise<Record<string, string>> {
    if (authToken) {
      return {
        Authorization: authToken,
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
    };
  }

  private async getAuthToken(): Promise<string> {
    const { authorizationValue } = await this.authService.getToken();

    return authorizationValue;
  }

  async publishTimeSensitiveAnswerEvent(
    questionId: string,
    timeSensitiveAnswerEventBody: TimeSensitiveAnswerEventBody
  ): Promise<TimeSensitiveAnswerEvent> {
    const data: RSTimeSensitiveAnswerEventBody =
      mapper.mapTimeSensitiveAnswerEventBodyToRSTimeSensitiveAnswerEventBody(
        timeSensitiveAnswerEventBody
      );
    const token = await this.getAuthToken();

    const url = `${this.basePath}/v1/time_sensitive_questions/${questionId}/answer`;
    const response = await lastValueFrom(
      this.httpService.post(url, data, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return mapper.mapRSTimeSensitiveAnswerEventToTimeSensitiveAnswerEvent(
      response.data
    );
  }

  async upsertTimeSensitiveScreeningResult(
    timeSensitiveScreeningResultBody: TimeSensitiveScreeningResultBody
  ): Promise<{ success: boolean }> {
    const data: RSTimeSensitiveScreeningResultBody =
      mapper.mapTimeSensitiveScreeningResultBodyToRSTimeSensitiveScreeningResultBody(
        timeSensitiveScreeningResultBody
      );
    const token = await this.getAuthToken();

    const url = `${this.basePath}/v1/time_sensitive_questions/screening_result`;
    await lastValueFrom(
      this.httpService.post(url, data, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return { success: true };
  }

  async getListTimeSensitiveQuestions(): Promise<TimeSensitiveQuestion[]> {
    const token = await this.getAuthToken();

    const url = `${this.basePath}/v1/time_sensitive_questions`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return response.data && response.data.questions
      ? response.data.questions.map(
          mapper.mapRSTimeSensitiveQuestionToTimeSensitiveQuestion
        )
      : [];
  }

  async getTimeSensitiveScreeningResult(
    careRequestId: string
  ): Promise<TimeSensitiveScreeningResultResponse[]> {
    const token = await this.getAuthToken();

    const url = `${this.basePath}/v1/time_sensitive_questions/screening_result/${careRequestId}`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return response.data && response.data.questions
      ? response.data.questions.map(
          mapper.mapRSTimeSensitiveScreeningResultBodyToTimeSensitiveScreeningResult
        )
      : [];
  }

  async searchSymptomAliases(
    queryParams: SearchSymptomAliasesParams
  ): Promise<SearchSymptomAliasesResponse> {
    const params: string = stringify(
      mapper.mapSearchSymptomAliasesParamsToRSSearchSymptomAliasesParams(
        queryParams
      )
    );
    const url = `${this.basePath}/v1/symptom_aliases/search?${params}`;
    const token = await this.getAuthToken();
    const headers = await this.getCommonHeaders(token);
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers,
      })
    );

    return response.data;
  }

  async upsertCareRequestSymptoms(
    upsertCareRequestSymptomsBody: CareRequestSymptomsBody
  ): Promise<{ success: boolean }> {
    const url = `${this.basePath}/v1/care_request_symptoms`;
    const token = await this.getAuthToken();
    await lastValueFrom(
      this.httpService.post(
        url,
        { ...upsertCareRequestSymptomsBody },
        {
          headers: await this.getCommonHeaders(token),
        }
      )
    );

    return { success: true };
  }
}
