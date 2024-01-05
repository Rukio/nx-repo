import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { stringify } from 'querystring';
import { AdvancedCarePatient } from '@*company-data-covered*/consumer-web-types';
import mapper from './advanced-care.mapper';
import { AuthService } from '@*company-data-covered*/nest/auth';

@Injectable()
export default class AdvancedCareService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  get basePath() {
    return `${this.configService.get('CARE_MANAGER_SERVICE_URL')}`;
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

  async getActivePatients(athenaId: string): Promise<AdvancedCarePatient[]> {
    const query: string = stringify(mapper.SearchActivePatientsQuery(athenaId));
    const token = await this.getAuthToken();

    const url = `${this.basePath}/v1/patients/active?${query}`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return response.data && response.data.patients
      ? response.data.patients.map(mapper.mapCMAdvancedPatientToAdvancedPatient)
      : [];
  }
}
