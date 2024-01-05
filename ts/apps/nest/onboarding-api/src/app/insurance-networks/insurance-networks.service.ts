import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

import mapper from './insurance-networks.mapper';
import {
  InsuranceNetwork,
  InsurancePayer,
  InsuranceServiceNetworkCreditCardRule,
} from '@*company-data-covered*/consumer-web-types';
import { AuthService } from '@*company-data-covered*/nest/auth';

@Injectable()
export default class InsuranceNetworksService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  /** Retrieves the base path for the Station service from the config service. */
  get basePath() {
    return `${this.configService.get('INSURANCE_SERVICE_URL')}`;
  }

  /** Retrieves an object with all the headers required to communicate with Insurance Service APIs.
   * Formatted for Axios request configuration. */
  private async getCommonHeaders(
    authToken: string
  ): Promise<Record<string, string>> {
    return {
      Authorization: authToken,
      'Content-Type': 'application/json',
    };
  }

  private async getAuthToken(): Promise<string> {
    const { authorizationValue } = await this.authService.getToken();

    return authorizationValue;
  }

  async fetch(insuranceNetworkId): Promise<InsuranceNetwork> {
    const url = `${this.basePath}/v1/networks/${insuranceNetworkId}`;
    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return mapper.ServicesInsuranceNetworkToInsuranceNetwork(
      response.data?.network
    );
  }

  async search(payload): Promise<InsuranceNetwork[]> {
    const servicePayload =
      mapper.SearchInsuranceNetworkToServiceInsuranceNetwork(payload);
    const url = `${this.basePath}/v1/networks/search`;
    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.post(url, servicePayload, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return response.data?.networks?.map(
      mapper.ServicesInsuranceNetworkToInsuranceNetwork
    );
  }

  async listInsurancePayers(payload): Promise<InsurancePayer[]> {
    const url = `${this.basePath}/v1/payers`;
    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
        params: payload,
      })
    );

    const result: InsurancePayer[] =
      response.data?.payers?.map(
        mapper.InsuranceServicePayersToInsurancePayers
      ) || [];

    return result;
  }

  async listNetworkCreditCardRules(
    insuranceNetworkId: number
  ): Promise<InsuranceServiceNetworkCreditCardRule[]> {
    const url = `${this.basePath}/v1/networks/${insuranceNetworkId}/credit_card_rules`;
    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return response.data?.creditCardRules;
  }
}
