import { CacheModule, INestApplication } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import mapper from '../credit-card.mapper';
import CreditCardService from '../credit-card.service';
import { CacheConfigService } from '../../common/cache.config.service';
import {
  MOCK_CREDIT_CARD,
  MOCK_CREDIT_CARD_PARAMS,
  MOCK_STATION_CREDIT_CARD,
  MOCK_UPDATE_CREDIT_CARD_PARAMS,
} from './mocks/credit-card.mock';
import LoggerModule from '../../logger/logger.module';
import { wrapInAxiosResponse } from '../../../testUtils/utils';

describe(`${CreditCardService.name}`, () => {
  let app: INestApplication;
  let service: CreditCardService;
  let httpService: HttpService;
  const spyMapperQueryParams = jest.spyOn(
    mapper,
    'CreditCardParamsToStationCreditCardParams'
  );
  const spyMapperResponse = jest.spyOn(mapper, 'StationCreditCardToCreditCard');

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [CreditCardService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();
    httpService = module.get<HttpService>(HttpService);
    service = module.get<CreditCardService>(CreditCardService);

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

  it('should return credit card', async () => {
    jest
      .spyOn(httpService, 'post')
      .mockImplementation(() =>
        of(wrapInAxiosResponse(MOCK_STATION_CREDIT_CARD))
      );
    expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
    expect(spyMapperResponse).toHaveBeenCalledTimes(0);
    const result = await service.create(MOCK_CREDIT_CARD_PARAMS);
    expect(result).toEqual(MOCK_CREDIT_CARD);
    expect(spyMapperQueryParams).toHaveBeenCalledWith(MOCK_CREDIT_CARD_PARAMS);
    expect(spyMapperResponse).toHaveBeenCalledWith(MOCK_STATION_CREDIT_CARD);
  });

  it('fetch credit card by id', async () => {
    jest
      .spyOn(httpService, 'get')
      .mockImplementation(() =>
        of(wrapInAxiosResponse([MOCK_STATION_CREDIT_CARD]))
      );
    expect(spyMapperResponse).toHaveBeenCalledTimes(0);
    const result = await service.fetch(123, null);
    expect(result).toEqual(MOCK_CREDIT_CARD);
    expect(spyMapperResponse).toHaveBeenCalledWith(MOCK_STATION_CREDIT_CARD);
  });

  it('update credit card', async () => {
    jest
      .spyOn(httpService, 'put')
      .mockImplementation(() =>
        of(wrapInAxiosResponse(MOCK_STATION_CREDIT_CARD))
      );
    expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
    expect(spyMapperResponse).toHaveBeenCalledTimes(0);
    const result = await service.update(3124, MOCK_UPDATE_CREDIT_CARD_PARAMS);
    expect(result).toEqual(MOCK_CREDIT_CARD);
    expect(spyMapperQueryParams).toHaveBeenCalledWith(
      MOCK_UPDATE_CREDIT_CARD_PARAMS
    );
    expect(spyMapperResponse).toHaveBeenCalledWith(MOCK_STATION_CREDIT_CARD);
  });

  it('delete credit card', async () => {
    jest
      .spyOn(httpService, 'delete')
      .mockImplementation(() => of(wrapInAxiosResponse(true)));
    const result = await service.delete('id');
    expect(result).toEqual(true);
  });

  it('get instamed iframe', async () => {
    jest
      .spyOn(httpService, 'get')
      .mockImplementation(() => of(wrapInAxiosResponse({ url: 'test' })));
    const result = await service.getIframeUrl(123);
    expect(result).toEqual({ url: 'test' });
  });
});
