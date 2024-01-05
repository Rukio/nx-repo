import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { mockClear, mockDeep, MockProxy } from 'jest-mock-extended';
import { Observable } from 'rxjs';

beforeEach(() => {
  mockClear(mockHttpService);
});

export type MockHttpService = MockProxy<Cache>;

export const mockHttpService = mockDeep<HttpService>({
  request: jest
    .fn()
    .mockReturnValue(new Observable((subscriber) => subscriber.next())),
  get: jest
    .fn()
    .mockReturnValue(new Observable((subscriber) => subscriber.next())),
  post: jest
    .fn()
    .mockReturnValue(new Observable((subscriber) => subscriber.next())),
  put: jest
    .fn()
    .mockReturnValue(new Observable((subscriber) => subscriber.next())),
  patch: jest
    .fn()
    .mockReturnValue(new Observable((subscriber) => subscriber.next())),
  delete: jest
    .fn()
    .mockReturnValue(new Observable((subscriber) => subscriber.next())),
});
