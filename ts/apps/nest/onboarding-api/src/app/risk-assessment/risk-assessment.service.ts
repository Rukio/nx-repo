import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RiskAssessment,
  StationRiskAssessment,
} from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import mapper from './risk-assessment.mapper';

@Injectable()
export default class RiskAssessmentService {
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

  /** Creates a Risk Assessment. */
  async create(
    careRequestId: number,
    payload: RiskAssessment
  ): Promise<RiskAssessment> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/risk_assessment.json`;
    const stationPayload: StationRiskAssessment =
      mapper.RiskAssessmentToStationRiskAssessment(payload);

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        {
          risk_assessment: stationPayload,
        },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: RiskAssessment = mapper.StationRiskAssessmentToRiskAssessment(
      response.data
    );

    return data;
  }

  /**
   * Retrieves a risk assessment using the given ID.
   *
   * Returns null if a care request with the specified ID does not exist.
   */
  async fetch(
    careRequestId: number,
    riskAssessmentId?: number
  ): Promise<RiskAssessment | null> {
    const url = riskAssessmentId
      ? `${this.basePath}/api/care_requests/${careRequestId}/risk_assessments/${riskAssessmentId}`
      : `${this.basePath}/api/care_requests/${careRequestId}/risk_assessment`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: RiskAssessment = mapper.StationRiskAssessmentToRiskAssessment(
      response.data
    );

    return data;
  }

  /**
   * Retrieves a risk assessment using the given ID.
   *
   * Returns null if a care request with the specified ID does not exist.
   */
  async update(
    careRequestId: number,
    riskAssessmentId: number,
    payload: RiskAssessment
  ): Promise<RiskAssessment | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/risk_assessments/${riskAssessmentId}`;
    const stationPayload: StationRiskAssessment =
      mapper.RiskAssessmentToStationRiskAssessment(payload);

    const response = await lastValueFrom(
      this.httpService.patch(
        url,
        {
          risk_assessment: stationPayload,
        },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: RiskAssessment = mapper.StationRiskAssessmentToRiskAssessment(
      response.data
    );

    return data;
  }

  /**
   * Deletes a risk assessment using the given ID.
   *
   * Returns null if a care request with the specified ID does not exist.
   */
  async delete(
    careRequestId: number,
    riskAssessmentId: number
  ): Promise<{ success: boolean } | null> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/risk_assessments/${riskAssessmentId}`;
    await lastValueFrom(
      this.httpService.delete(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    return { success: true };
  }
}
