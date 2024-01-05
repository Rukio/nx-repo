import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  InsurancePlan,
  EhrInsurancePlan,
} from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import { stringify } from 'query-string';
import EhrInsurancePlanQueryDto from './dto/ehr-insurance-plans-query.dto';
import mapper from './insurance-plans.mapper';

@Injectable()
export default class InsurancePlansService {
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

  async fetch(billingCityId: string): Promise<InsurancePlan[]> {
    const url = `${this.basePath}/api/billing_cities/${billingCityId}/insurance_plans`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: InsurancePlan[] = response.data.map(
      mapper.StationInsurancePlanToInsurancePlan
    );

    return data;
  }

  async fetchEhr(
    payload: EhrInsurancePlanQueryDto
  ): Promise<EhrInsurancePlan[]> {
    const query: string = stringify(
      mapper.EhrinsurancePlanParamToEhrStationInsurancePlanParam(payload)
    );

    const url = query
      ? `${this.basePath}/api/ehrs/insurances?${query}`
      : `${this.basePath}/api/ehrs/insurances?check_case_policies=false`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: EhrInsurancePlan[] = response.data.map(
      mapper.EhrStationinsurancePlanToEhrInsurancePlan
    );

    return data;
  }
}
