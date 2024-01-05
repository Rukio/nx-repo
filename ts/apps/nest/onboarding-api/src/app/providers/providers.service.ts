import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService, HttpModuleOptions } from '@nestjs/axios';
import { Provider } from '@*company-data-covered*/consumer-web-types';
import { lastValueFrom } from 'rxjs';
import mapper from './providers.mapper';
import ProvidersQueryDto from './dto/providers-params.dto';
import ProviderCallSearchParamsDto from './dto/providers-call-search.dto';
import ProvidersBodyDto from './dto/provider-search.dto';

@Injectable()
export default class ProvidersService {
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

  async fetch(query?: ProviderCallSearchParamsDto): Promise<Provider | null> {
    const url = `${this.basePath}/api/providers/call_search?provider[genesys_id]=${query.genesysId}&provider[mobile_number]=${query.mobileNumber}`;
    const config: HttpModuleOptions = {
      headers: await this.getCommonHeaders(),
    };
    const response = await lastValueFrom(this.httpService.get(url, config));

    if (!response.data) {
      return null;
    }

    return mapper.StationProviderToProvider(response.data);
  }

  async fetchAll(query?: ProvidersQueryDto): Promise<Provider[]> {
    const url = `${this.basePath}/api/providers`;
    const config: HttpModuleOptions = {
      headers: await this.getCommonHeaders(),
    };
    if (query) {
      config.params = mapper.ProviderQueryToStationProviderQuery(query);
    }
    const response = await lastValueFrom(this.httpService.get(url, config));
    const data: Provider[] = response.data.map(
      mapper.StationProviderToProvider
    );

    return data;
  }

  async fetchByName(body?: ProvidersBodyDto): Promise<Provider[] | null> {
    const url = `${this.basePath}/api/providers/search.json`;
    const payload = mapper.ProviderBodyToStationProviderBody(body);
    const config: HttpModuleOptions = {
      headers: await this.getCommonHeaders(),
    };
    const response = await lastValueFrom(
      this.httpService.post(url, payload, config)
    );

    if (!response.data) {
      return null;
    }

    return response.data.map(mapper.StationProviderToProvider);
  }
}
