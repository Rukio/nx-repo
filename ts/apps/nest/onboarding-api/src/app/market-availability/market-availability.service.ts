import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Logger } from 'winston';
import { lastValueFrom } from 'rxjs';

import {
  MarketsAvailabilityZipcode,
  CheckMarketAvailability,
  CheckMarketAvailabilityBody,
  StationCheckMarketAvailabilityBody,
  StationMarketAvailabilityBody,
  MarketAvailabilityBody,
  MarketAvailabilities,
} from '@*company-data-covered*/consumer-web-types';

import mapper from './market-availability.mapper';
import marketMapper from '../market/market.mapper';
import { InjectLogger } from '../decorators/logger.decorator';

@Injectable()
export default class MarketAvailabilityService {
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

  async fetchMarketByZipcode(
    zipcode: number | string,
    shortName?: string
  ): Promise<MarketsAvailabilityZipcode> {
    const zipcodeUrl = `${this.basePath}/api/zipcodes?zipcode=${zipcode}`;
    const response = await lastValueFrom(
      this.httpService.get(zipcodeUrl, {
        headers: await this.getCommonHeaders(),
      })
    );

    if (!response.data) {
      return null;
    }

    const data: MarketsAvailabilityZipcode =
      mapper.StationMarketsAvailabilityZipcodeToMarketsAvailabilityZipcode(
        response.data
      );

    const marketId = data?.marketId;
    if (shortName === 'true' && marketId) {
      try {
        const marketDetailsUrl = `${this.basePath}/api/markets/${marketId}`;
        const marketResponse = await lastValueFrom(
          this.httpService.get(marketDetailsUrl, {
            headers: await this.getCommonHeaders(),
          })
        );
        const marketDetails = marketMapper.StationMarketToMarket(
          marketResponse.data
        );

        return {
          ...data,
          marketShortName: marketDetails.shortName,
        };
      } catch (error) {
        this.logger.error(
          `MarketAvailabilityService pulling marketId ${marketId} short name error: ${error?.message}`
        );
      }
    }

    return data;
  }

  async checkMarketAvailability(
    payload: CheckMarketAvailabilityBody
  ): Promise<CheckMarketAvailability | null> {
    const stationPayload: StationCheckMarketAvailabilityBody =
      mapper.CheckMarketAvailabilityBodyToStationCheckMarketAvailabilityBody(
        payload
      );

    const url = `${this.basePath}/api/markets/check_availability`;

    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    return response.data;
  }

  async marketAvailability(
    payload: MarketAvailabilityBody
  ): Promise<MarketAvailabilities> {
    const url = `${this.basePath}/api/markets/market_availability`;

    const stationPayload: StationMarketAvailabilityBody =
      mapper.MarketAvailabilityBodyToStationMarketAvailabilityBody(payload);

    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    return response.data;
  }
}
