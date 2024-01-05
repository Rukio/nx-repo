import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { mockDeep, mockReset } from 'jest-mock-extended';
import {
  CheckMarketAvailability,
  MarketAvailabilities,
  MarketAvailabilityBody,
  MarketsAvailabilityZipcode,
} from '@*company-data-covered*/consumer-web-types';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import MarketAvailabilityController from '../market-availability.controller';
import MarketAvailabilityService from '../market-availability.service';
import MarketAvailabilityModule from '../market-availability.module';

let httpService: HttpService;

describe('MarketAvailabilityController', () => {
  let controller: MarketAvailabilityController;
  const mockMarketAvailabilityService = mockDeep<MarketAvailabilityService>();

  beforeEach(async () => {
    mockReset(mockMarketAvailabilityService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [MarketAvailabilityModule],
    })
      .overrideProvider(MarketAvailabilityService)
      .useValue(mockMarketAvailabilityService)
      .compile();

    httpService = module.get<HttpService>(HttpService);

    controller = module.get<MarketAvailabilityController>(
      MarketAvailabilityController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('fetch market by zipcode from station should return market data', async () => {
    const res: MarketsAvailabilityZipcode = {
      id: 2034,
      marketId: 165,
      billingCityId: 10,
    };
    mockMarketAvailabilityService.fetchMarketByZipcode.mockResolvedValue(res);
    const zipcode = '77015';

    const result = await controller.fetch(zipcode);
    expect(result.success).toEqual(true);
    expect(mockMarketAvailabilityService.fetchMarketByZipcode).toBeCalledTimes(
      1
    );
    expect(mockMarketAvailabilityService.fetchMarketByZipcode).toBeCalledWith(
      zipcode,
      undefined
    );
    expect(result).toStrictEqual({ success: true, data: res });
    expect(result.data).toEqual(res);
  });

  it('fetch market by zipcode from station should return null for unexisting market', async () => {
    const response: AxiosResponse = wrapInAxiosResponse({}, 200, 'OK');
    jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));
    mockMarketAvailabilityService.fetchMarketByZipcode.mockResolvedValue(null);
    const zipcode = '10045';

    const result = await controller.fetch(zipcode);
    expect(result.success).toEqual(true);
    expect(mockMarketAvailabilityService.fetchMarketByZipcode).toBeCalledTimes(
      1
    );
    expect(mockMarketAvailabilityService.fetchMarketByZipcode).toBeCalledWith(
      zipcode,
      undefined
    );
    expect(result).toStrictEqual({ success: true, data: null });
    expect(result.data).toEqual(null);
  });

  it('fetch availablility status from station', async () => {
    const res: CheckMarketAvailability = {
      availability: 'available',
    };
    mockMarketAvailabilityService.checkMarketAvailability.mockResolvedValue(
      res
    );

    const requestBody = {
      zipcode: '80205',
    };

    const result = await controller.check(requestBody);
    expect(
      mockMarketAvailabilityService.checkMarketAvailability
    ).toBeCalledTimes(1);
    expect(
      mockMarketAvailabilityService.checkMarketAvailability
    ).toBeCalledWith(requestBody);
    expect(result).toStrictEqual({ success: true, data: res });
  });

  it('fetch availability status errorr', async () => {
    mockMarketAvailabilityService.fetchMarketByZipcode.mockImplementationOnce(
      () => {
        throw new Error('error');
      }
    );
    await expect(async () => {
      await controller.fetch('80205', 'DEN');
    }).rejects.toThrow(HttpException);
  });

  it('check availability status errorr', async () => {
    mockMarketAvailabilityService.checkMarketAvailability.mockImplementationOnce(
      () => {
        throw new Error('error');
      }
    );
    await expect(async () => {
      await controller.check({
        zipcode: '80205',
      });
    }).rejects.toThrow(HttpException);
  });

  it('fetch market availability', async () => {
    const requestBody: MarketAvailabilityBody = {
      market_id: 123,
      service_date: '02/02/2023',
      requested_service_line: 'acute_care',
    };

    const response: MarketAvailabilities = {
      availabilities: [
        {
          availability: 'available',
        },
        {
          availability: 'limited_availability',
        },
      ],
    };

    mockMarketAvailabilityService.marketAvailability.mockResolvedValue(
      response
    );
    const result = await controller.availability(requestBody);
    expect(mockMarketAvailabilityService.marketAvailability).toBeCalledTimes(1);
    expect(result).toEqual({ success: true, data: response });
  });

  it('fetch market availability with error', async () => {
    mockMarketAvailabilityService.marketAvailability.mockImplementationOnce(
      () => {
        throw new Error('oops');
      }
    );
    const requestBody: MarketAvailabilityBody = {
      market_id: 123,
      service_date: '02/02/2023',
      requested_service_line: 'acute_care',
    };
    await expect(async () => {
      await controller.availability(requestBody);
    }).rejects.toThrow(HttpException);
  });
});
