import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, mockReset } from 'jest-mock-extended';
import {
  CareRequestAPIResponse,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import ChannelItemsController from '../channel-items.controller';
import ChannelItemsService from '../channel-items.service';
import ChannelItemsModule from '../channel-items.module';
import LoggerModule from '../../logger/logger.module';
import {
  MOCK_CHANNEL_ITEM,
  CHANNEL_ITEMS_PARAMS,
} from './mocks/channel-items.mock';
import { CacheConfigService } from '../../common/cache.config.service';

describe(`${ChannelItemsController.name}`, () => {
  let controller: ChannelItemsController;
  const mockChannelItemService = mockDeep<ChannelItemsService>();

  beforeEach(async () => {
    mockReset(mockChannelItemService);
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ChannelItemsModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(ChannelItemsService)
      .useValue(mockChannelItemService)
      .compile();

    controller = module.get<ChannelItemsController>(ChannelItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return channel item by search params', async () => {
    const response: CareRequestAPIResponse<ChannelItem[]> = {
      success: true,
      data: [MOCK_CHANNEL_ITEM],
    };
    mockChannelItemService.search.mockResolvedValue([MOCK_CHANNEL_ITEM]);
    expect(await controller.search(CHANNEL_ITEMS_PARAMS)).toEqual(response);
    expect(mockChannelItemService.search).toBeCalled();
  });

  it('should return channel item by id', async () => {
    const channelItemId = '159';
    const response: CareRequestAPIResponse<ChannelItem> = {
      success: true,
      data: MOCK_CHANNEL_ITEM,
    };
    mockChannelItemService.fetch.mockResolvedValue(MOCK_CHANNEL_ITEM);
    expect(await controller.fetch(channelItemId)).toStrictEqual(response);
    expect(mockChannelItemService.fetch).toBeCalled();
  });

  it('should return channel item by phone', async () => {
    const phone = '303-555-1234';
    const response: CareRequestAPIResponse<ChannelItem> = {
      success: true,
      data: MOCK_CHANNEL_ITEM,
    };
    mockChannelItemService.fetch.mockResolvedValue(MOCK_CHANNEL_ITEM);
    expect(await controller.fetch(phone)).toStrictEqual(response);
    expect(mockChannelItemService.fetch).toBeCalled();
  });

  it('error for search channel item by search params', async () => {
    mockChannelItemService.search.mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(() => controller.search(CHANNEL_ITEMS_PARAMS)).rejects.toThrow(
      HttpException
    );
  });

  it('error for search channel item by id', async () => {
    const channelItemId = '159';
    mockChannelItemService.fetch.mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(() => controller.fetch(channelItemId)).rejects.toThrow(
      HttpException
    );
  });
});
