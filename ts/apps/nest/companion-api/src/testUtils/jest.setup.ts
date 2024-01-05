import { mockClear } from 'jest-mock-extended';

jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('statsig-node');

const consoleErrorSpy = jest
  .spyOn(global.console, 'error')
  .mockImplementation(jest.fn());

export const mutexAcquireMock = jest.fn();
export const mutexReleaseMock = jest.fn();

export const IMAGE_UPLOAD_TIMEOUT = 10000;

jest.mock('@nestjs/schedule', () => {
  const actual = jest.requireActual('@nestjs/schedule');

  return {
    ...actual,
    Interval: () => jest.fn(),
  };
});

jest.mock('redis-semaphore', () => ({
  Mutex: jest.fn().mockReturnValue({
    acquire: mutexAcquireMock,
    release: mutexReleaseMock,
  }),
}));

beforeEach(() => {
  mockClear(consoleErrorSpy);
  mockClear(mutexAcquireMock);
  mockClear(mutexReleaseMock);
});
