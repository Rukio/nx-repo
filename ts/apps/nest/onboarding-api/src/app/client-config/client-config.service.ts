import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { LogDNAConfig } from '@*company-data-covered*/consumer-web-types';
import mapper from './client-config.mapper';
import { HealthDependency } from '../health-check/interfaces/health-dependency.interface';

@Injectable()
export default class ClientConfigService implements HealthDependency {
  readonly healthCheckKey = 'ClientConfig:Healthy';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) {}

  async markAsHealthy(): Promise<void> {
    await this.cache.set<boolean>(this.healthCheckKey, true, { ttl: 0 });
  }

  async markAsUnhealthy(): Promise<void> {
    await this.cache.set<boolean>(this.healthCheckKey, false, { ttl: 0 });
  }

  async isHealthy(): Promise<boolean | undefined> {
    return this.cache.get<boolean>(this.healthCheckKey);
  }

  /** Retrieves the base path for the Station service from the config service. */
  get basePath(): string {
    return `${this.configService.get('STATION_URL')}`;
  }

  /** Retrieves an object with all of the headers required to communicate with Station APIs. Formatted for Axios request configuration. */
  private getCommonHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  async getLogDNA(): Promise<LogDNAConfig> {
    const url = `${this.basePath}/api/config/log_dna`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: this.getCommonHeaders(),
      })
    );
    const data: LogDNAConfig = mapper.StationLogDNAConfigToLogDNAConfig(
      response.data
    );

    return data;
  }
}
