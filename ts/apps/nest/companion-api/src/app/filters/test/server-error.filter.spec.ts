import { ServerErrorFilter } from '../server-error.filter';
import { Logger } from 'winston';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime';
import { mockDeep } from 'jest-mock-extended';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  CompanionSessionExpressRequest,
  CompanionSessionUserModel,
} from '../../companion/companion.strategy';
import { buildMockSessionUser } from '../../companion/mocks/companion-session-user.mock';
import { Test } from '@nestjs/testing';
import { LoggerModule } from '../../logger/logger.module';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CommonModule } from '../../common/common.module';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../../companion/mocks/segment.service.mock';

describe(`${ServerErrorFilter.name}`, () => {
  const mockJson = jest.fn();
  let mockedSuperCatch: jest.SpyInstance;
  const mockStatus = jest.fn().mockImplementation(() => ({
    json: mockJson,
  }));
  const mockGetResponse = jest.fn().mockImplementation(() => ({
    status: mockStatus,
  }));
  const buildMockHttpArgumentsHost = (
    sessionUser?: CompanionSessionUserModel
  ) =>
    jest.fn().mockImplementation(() => ({
      getResponse: mockGetResponse,
      getRequest: jest.fn().mockReturnValue(
        mockDeep<CompanionSessionExpressRequest>({
          user: sessionUser,
        })
      ),
    }));

  const buildMockArgumentsHost = (
    ...args: Parameters<typeof buildMockHttpArgumentsHost>
  ) => ({
    switchToHttp: buildMockHttpArgumentsHost(...args),
    getArgByIndex: jest.fn(),
    getArgs: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  });

  const defaultMockArgumentsHost = buildMockArgumentsHost(
    buildMockSessionUser()
  );

  const mockLogger = mockDeep<Logger>();

  let filter: ServerErrorFilter;

  const buildMockSuperCatch = () =>
    jest.spyOn(BaseExceptionFilter.prototype, 'catch').mockReturnValue();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule, CommonModule],
      providers: [ServerErrorFilter],
    })
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .compile();

    filter = module.get<ServerErrorFilter>(ServerErrorFilter);
    mockedSuperCatch = buildMockSuperCatch();
    mockedSuperCatch?.mockClear();
  });

  it('should be defined', () => {
    expect(new ServerErrorFilter(mockLogger, mockSegmentService)).toBeDefined();
  });

  describe(`${ServerErrorFilter.prototype.catch.name}`, () => {
    it('should log the error to logger', () => {
      filter.catch(new Error('new Error'), defaultMockArgumentsHost);

      expect(mockLogger.error).toBeCalledTimes(1);
    });

    test(`should catch ${PrismaClientKnownRequestError.name}`, () => {
      filter.catch(
        new PrismaClientKnownRequestError(
          'PrismaClientKnownRequestError',
          '123',
          '1.2'
        ),
        defaultMockArgumentsHost
      );

      expect(mockedSuperCatch).toBeCalledTimes(1);
      expect(mockLogger.error).toBeCalledWith('PrismaClientKnownRequestError', {
        error: 'Error',
        status: '123',
      });
    });

    test(`should catch ${PrismaClientUnknownRequestError.name}`, () => {
      filter.catch(
        new PrismaClientUnknownRequestError(
          'PrismaClientUnknownRequestError',
          '123'
        ),
        defaultMockArgumentsHost
      );

      expect(mockedSuperCatch).toBeCalledTimes(1);
      expect(mockLogger.error).toBeCalledWith(
        'PrismaClientUnknownRequestError',
        {
          error: 'Error',
          status: undefined,
        }
      );
    });

    test(`should catch ${NotFoundException.name}`, () => {
      filter.catch(
        new NotFoundException('Not found'),
        defaultMockArgumentsHost
      );

      expect(mockedSuperCatch).toBeCalledTimes(1);
      expect(mockLogger.error).toBeCalledWith('Not found', {
        error: 'NotFoundException',
        status: 404,
      });
    });

    test(`should catch ${InternalServerErrorException.name}`, () => {
      filter.catch(
        new InternalServerErrorException('error server'),
        defaultMockArgumentsHost
      );

      expect(mockedSuperCatch).toBeCalledTimes(1);
      expect(mockLogger.error).toBeCalledWith('error server', {
        error: 'InternalServerErrorException',
        status: 500,
      });
    });

    test(`should catch ${Error.name}`, () => {
      filter.catch(new Error('error message'), defaultMockArgumentsHost);

      expect(mockedSuperCatch).toBeCalledTimes(1);
      expect(mockLogger.error).toBeCalledWith('error message', {
        error: 'Error',
        status: undefined,
      });
    });

    test(`should catch ${BadRequestException.name}`, () => {
      filter.catch(
        new BadRequestException('Value not supported'),
        defaultMockArgumentsHost
      );

      expect(mockedSuperCatch).toBeCalledTimes(1);
      expect(mockLogger.error).toBeCalledWith('Value not supported', {
        error: 'BadRequestException',
        status: 400,
      });
    });
  });
});
