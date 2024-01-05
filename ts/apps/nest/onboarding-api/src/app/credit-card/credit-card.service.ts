import { Injectable } from '@nestjs/common';
import {
  CreditCard,
  CreditCardParams,
  StationCreditCardParams,
  UpdateCreditCardParams,
} from '@*company-data-covered*/consumer-web-types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import mapper from './credit-card.mapper';

@Injectable()
export default class CreditCardService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  /** Retrieves the base path for the Station service from the config service. */
  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  /** Retrieves an object with all of the headers required to communicate with Station APIs. Formatted for Axios request configuration. */
  private async getCommonHeaders(
    authToken?: string
  ): Promise<Record<string, string>> {
    if (authToken) {
      return {
        Authorization: authToken,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.*company-data-covered*.com; version=1',
      };
    }

    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  async create(payload: CreditCardParams): Promise<CreditCard> {
    const stationPayload: StationCreditCardParams =
      mapper.CreditCardParamsToStationCreditCardParams(payload);

    const authHeader = <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );

    const url = `${this.basePath}/api/onboarding/patients/${payload.patientId}/credit_cards`;

    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: CreditCard = mapper.StationCreditCardToCreditCard(
      response.data
    );

    if (data && payload.careRequestId) {
      const careRequestUrl = `${this.basePath}/api/onboarding/care_requests/${payload.careRequestId}/credit_cards`;

      await lastValueFrom(
        this.httpService.post(
          careRequestUrl,
          { credit_card_id: data.id },
          {
            headers: await this.getCommonHeaders(authHeader),
          }
        )
      );
    }

    return data;
  }

  async fetch(patientId: number, careRequestId?: number): Promise<CreditCard> {
    const url = `${this.basePath}/api/onboarding/patients/${patientId}/credit_cards`;

    const authHeader = <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    // return just the latest card
    const data: CreditCard =
      response.data.length > 0
        ? mapper.StationCreditCardToCreditCard(response.data[0])
        : null;

    if (!data && careRequestId) {
      const careRequestUrl = `${this.basePath}/api/onboarding/care_requests/${careRequestId}/credit_cards`;

      const creditCard = await lastValueFrom(
        this.httpService.get(careRequestUrl, {
          headers: await this.getCommonHeaders(authHeader),
        })
      );

      return creditCard.data.length > 0
        ? mapper.StationCreditCardToCreditCard(creditCard.data[0])
        : null;
    }

    return data;
  }

  async update(
    id: number,
    payload: UpdateCreditCardParams
  ): Promise<CreditCard> {
    const url = `${this.basePath}/api/onboarding/patients/${payload.patientId}/credit_cards/${id}`;
    const stationPayload =
      mapper.CreditCardParamsToStationCreditCardParams(payload);
    const response = await lastValueFrom(
      this.httpService.put(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: CreditCard = mapper.StationCreditCardToCreditCard(
      response.data
    );

    return data;
  }

  async getIframeUrl(patientId: number): Promise<{ url: string }> {
    const url = `${this.basePath}/api/onboarding/patients/${patientId}/credit_cards/iframe`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    return response.data;
  }

  async delete(id: string): Promise<boolean> {
    const url = `${this.basePath}/api/onboarding/credit_cards/${id}`;

    const response = await lastValueFrom(
      this.httpService.delete(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    return response.data;
  }
}
