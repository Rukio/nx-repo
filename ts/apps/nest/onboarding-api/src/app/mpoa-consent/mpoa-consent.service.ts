import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  CreateMpoaConsent,
  MpoaConsent,
  StationCreateMpoaConsent,
  StationUpdateMpoaConsent,
  UpdateMpoaConsent,
} from '@*company-data-covered*/consumer-web-types';
import mapper from './mpoa-consent.mapper';

@Injectable()
export default class MpoaConsentService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  private async getCommonHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  async get(careRequestId: number): Promise<MpoaConsent> {
    const url = `${this.basePath}/api/onboarding/mpoa_consents/${careRequestId}`;
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: await this.getCommonHeaders(),
        })
      );

      return mapper.StationMpoaConsentToMpoaConsent(response.data);
    } catch (error) {
      if (error?.response?.status === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  async create(
    payload: CreateMpoaConsent,
    careRequestId: number
  ): Promise<MpoaConsent> {
    const stationPayload: StationCreateMpoaConsent =
      mapper.CreateMpoaConsentToStationCreateMpoaConsent(
        payload,
        careRequestId
      );
    const url = `${this.basePath}/api/onboarding/mpoa_consents.json`;
    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    return mapper.StationMpoaConsentToMpoaConsent(response.data);
  }

  async update(
    mpoaConsentId: number,
    payload: UpdateMpoaConsent
  ): Promise<MpoaConsent> {
    const stationPayload: StationUpdateMpoaConsent =
      mapper.UpdateMpoaConsentToStationCreateMpoaConsent(payload);
    const url = `${this.basePath}/api/onboarding/mpoa_consents/${mpoaConsentId}`;
    const response = await lastValueFrom(
      this.httpService.patch(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    return mapper.StationMpoaConsentToMpoaConsent(response.data);
  }
}
