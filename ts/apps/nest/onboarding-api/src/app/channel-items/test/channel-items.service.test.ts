import { HttpModule, HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { StationChannelItem } from '@*company-data-covered*/consumer-web-types';
import { of } from 'rxjs';
import {
  MOCK_CHANNEL_ITEM,
  MOCK_STATION_CHANNEL_ITEM,
  CHANNEL_ITEMS_PARAMS,
  CHANNEL_ITEMS_PARAMS_MARKET_ID,
} from './mocks/channel-items.mock';
import { CacheConfigService } from '../../common/cache.config.service';
import ChannelItemsService from '../channel-items.service';
import mapper from '../channel-items.mapper';
import stationMapper from '../../station/station.mapper';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { mockDeep } from 'jest-mock-extended';
import StationService from '../../station/station.service';

describe(`${ChannelItemsService.name}`, () => {
  let app: INestApplication;
  let channelItemsService: ChannelItemsService;
  const mockStationService = mockDeep<StationService>();
  let httpService: HttpService;
  const spyMapperQueryParams = jest.spyOn(
    mapper,
    'SearchChannelItemToStationSearchChannelItem'
  );
  const spyMapperResponse = jest.spyOn(
    stationMapper,
    'StationChannelItemToChannelItem'
  );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ChannelItemsService, StationService],
      imports: [
        HttpModule,
        ConfigModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(StationService)
      .useValue(mockStationService)
      .compile();
    httpService = module.get<HttpService>(HttpService);
    channelItemsService = module.get<ChannelItemsService>(ChannelItemsService);

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    spyMapperQueryParams.mockClear();
    spyMapperResponse.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${ChannelItemsService.prototype.search.name}`, () => {
    const mockResult: StationChannelItem[] = [MOCK_STATION_CHANNEL_ITEM];

    it('should return channel item with params', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(mockResult)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await channelItemsService.search(CHANNEL_ITEMS_PARAMS);
      expect(response).toEqual([MOCK_CHANNEL_ITEM]);
      expect(spyMapperQueryParams).toHaveBeenCalledWith(CHANNEL_ITEMS_PARAMS);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        MOCK_STATION_CHANNEL_ITEM,
        expect.any(Number),
        mockResult
      );
    });

    it('should return channel item without channelName', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(mockResult)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await channelItemsService.search(
        CHANNEL_ITEMS_PARAMS_MARKET_ID
      );
      expect(response).toEqual([MOCK_CHANNEL_ITEM]);
      expect(spyMapperQueryParams).toHaveBeenCalledWith(
        CHANNEL_ITEMS_PARAMS_MARKET_ID
      );
      expect(spyMapperResponse).toHaveBeenCalledWith(
        MOCK_STATION_CHANNEL_ITEM,
        expect.any(Number),
        mockResult
      );
    });
  });

  describe(`${ChannelItemsService.prototype.fetch.name}`, () => {
    it('should return channel item with id', async () => {
      const channelItemId = '159';
      mockStationService.fetchChannelItem.mockResolvedValue(MOCK_CHANNEL_ITEM);
      const response = await channelItemsService.fetch(channelItemId);
      expect(response).toEqual(MOCK_CHANNEL_ITEM);
    });
  });
});
