import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Logger } from 'winston';

import { Market } from '@*company-data-covered*/consumer-web-types';

import mapper from './market.mapper';
import { InjectLogger } from '../decorators/logger.decorator';

@Injectable()
export default class MarketService {
  constructor(
    @InjectLogger() private logger: Logger,
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

  async fetch(marketId: number | string): Promise<Market> {
    const marketUrl = `${this.basePath}/api/markets/${marketId}`;
    const response = await lastValueFrom(
      this.httpService.get(marketUrl, {
        headers: await this.getCommonHeaders(),
      })
    );

    return mapper.StationMarketToMarket(response.data);
  }

  async fetchAll(): Promise<Market[]> {
    const marketsUrl = `${this.basePath}/api/markets`;
    const response = await lastValueFrom(
      this.httpService.get(marketsUrl, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: Market[] = response.data.map(mapper.StationMarketToMarket);

    return data;
  }

  async fetchAllTelepresentation(): Promise<Market[]> {
    const telepresentationMarketsUrl = `${this.basePath}/api/markets/telepresentation`;
    const response = await lastValueFrom(
      this.httpService.get(telepresentationMarketsUrl, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: Market[] = response.data.map(mapper.StationMarketToMarket);

    return data;
  }
}
