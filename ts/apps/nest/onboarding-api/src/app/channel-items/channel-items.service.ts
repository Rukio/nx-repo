import { stringify } from 'query-string';
import { Injectable } from '@nestjs/common';
import {
  ChannelItemSearchParam,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import mapper from './channel-items.mapper';
import stationMapper from './../station/station.mapper';
import StationService from '../station/station.service';

@Injectable()
export default class ChannelItemsService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private stationService: StationService
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

  async search(payload: ChannelItemSearchParam): Promise<ChannelItem[]> {
    const keys = Object.keys(payload);
    const searchByMarketId = keys.length === 1 && keys[0] === 'marketId';

    const query: string = stringify(
      mapper.SearchChannelItemToStationSearchChannelItem(payload)
    );

    const url = searchByMarketId
      ? `${this.basePath}/api/channel_items.json?${query}`
      : `${this.basePath}/api/channel_items/search.json?${query}`;
    // todo filter using limit and offset
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: ChannelItem[] = response.data.map(
      stationMapper.StationChannelItemToChannelItem
    );

    return data;
  }

  fetch(id: string): Promise<ChannelItem> {
    return this.stationService.fetchChannelItem(id, false);
  }
}
