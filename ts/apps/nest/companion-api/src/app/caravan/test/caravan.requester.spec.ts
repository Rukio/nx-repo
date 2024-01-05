import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { CaravanModule } from '../caravan.module';
import { CaravanRequester } from '../caravan.requester';
import { HttpService } from '@nestjs/axios';
import { mockHttpService } from '../../common/mocks/http.service.mock';
import { AxiosRequestConfig } from 'axios';
import { mockAuthService } from '../../auth/mocks';
import { AuthService } from '@*company-data-covered*/nest/auth';

describe(`${CaravanRequester.name}`, () => {
  let app: INestApplication | undefined;
  let requester: CaravanRequester;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CaravanModule, CommonModule],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    requester = moduleRef.get<CaravanRequester>(CaravanRequester);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe(`${CaravanRequester.prototype.executeCaravanRequest.name}`, () => {
    test(`should execute request`, async () => {
      const mockPath = '/path/to/fake/endpoint';
      const mockMethod: AxiosRequestConfig['method'] = 'GET';
      const expectedRequestConfig: AxiosRequestConfig = {
        url: mockPath,
        baseURL: requester.BASE_URL,
        method: mockMethod,
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer '),
        }),
      };

      await requester.executeCaravanRequest(mockPath, { method: mockMethod });
      expect(mockHttpService.request).toHaveBeenCalledTimes(1);
      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining(expectedRequestConfig)
      );
    });

    test(`should include provided headers`, async () => {
      const mockPath = '/path/to/fake/endpoint';
      const mockMethod: AxiosRequestConfig['method'] = 'GET';
      const mockHeaders: AxiosRequestConfig['headers'] = {
        fake: 'header',
      };
      const expectedRequestConfig: AxiosRequestConfig = {
        url: mockPath,
        baseURL: requester.BASE_URL,
        method: mockMethod,
        headers: expect.objectContaining({
          ...mockHeaders,
          Authorization: expect.stringContaining('Bearer '),
        }),
      };

      await requester.executeCaravanRequest(mockPath, {
        method: mockMethod,
        headers: mockHeaders,
      });
      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining(expectedRequestConfig)
      );
    });

    test(`should overwrite included "Authorization header`, async () => {
      const mockPath = '/path/to/fake/endpoint';
      const mockMethod: AxiosRequestConfig['method'] = 'GET';
      const mockHeaders: AxiosRequestConfig['headers'] = {
        fake: 'header',
        Authorization: 'not a valid authorization header',
      };
      const expectedRequestConfig: AxiosRequestConfig = {
        url: mockPath,
        baseURL: requester.BASE_URL,
        method: mockMethod,
        headers: expect.objectContaining({
          ...mockHeaders,
          Authorization: expect.stringContaining('Bearer '),
        }),
      };

      await requester.executeCaravanRequest(mockPath, {
        method: mockMethod,
        headers: mockHeaders,
      });
      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining(expectedRequestConfig)
      );
    });
  });
});
