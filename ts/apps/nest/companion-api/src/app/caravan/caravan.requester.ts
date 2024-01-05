import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@*company-data-covered*/nest/auth';
import { getRequiredEnvironmentVariable } from '../utility/utils';

@Injectable()
export class CaravanRequester {
  public readonly BASE_URL: string;

  constructor(
    private http: HttpService,
    config: ConfigService,
    private auth: AuthService
  ) {
    this.BASE_URL = getRequiredEnvironmentVariable('CARAVAN_URL', config);
  }

  async executeCaravanRequest<T, U = unknown>(
    path: string,
    config: Omit<AxiosRequestConfig<U>, 'baseURL' | 'url'>
  ) {
    const { headers, ...rest } = config;

    const token = await this.auth.getToken();

    const headersWithAuth: AxiosRequestConfig['headers'] = {
      ...headers,
      Authorization: token.authorizationValue,
    };

    return firstValueFrom(
      this.http.request<T>({
        headers: headersWithAuth,
        baseURL: this.BASE_URL,
        url: path,
        ...rest,
      })
    );
  }
}
