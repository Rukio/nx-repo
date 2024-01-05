import { Test, TestingModule } from '@nestjs/testing';
import { CompanionModule } from '../companion.module';
import { CompanionService } from '../companion.service';
import { mockCompanionService } from '../mocks/companion.service.mock';
import { CompanionLinkStatusInterceptor } from '../companion-link-status.interceptor';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import {
  buildMockCareRequest,
  buildMockDashboardWebhookCareRequest,
} from '../../care-request/mocks/care-request.repository.mock';
import {
  NotFoundException,
  BadRequestException,
  GoneException,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { buildMockCompanionInfoFromCareRequest } from '../mocks/companion-info.mock';
import { subDays } from 'date-fns';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { CurrentStateDto } from '../../care-request/dto/current-state.dto';
import { CommonModule } from '../../common/common.module';
import { firstValueFrom, Observable } from 'rxjs';
import { buildMockCompanionLinkWithTasks } from '../mocks/companion-link.mock';
import { mockStatsigService } from '../../statsig/mocks/statsig.service.mock';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../mocks/segment.service.mock';

describe(`${CompanionLinkStatusInterceptor.name}`, () => {
  let interceptor: CompanionLinkStatusInterceptor;
  let executionContext: ExecutionContext;
  let callHandler: MockProxy<CallHandler>;
  const expirationSeconds = 2592000;
  const expiredDate = subDays(new Date(), expirationSeconds);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(CompanionService)
      .useValue(mockCompanionService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .compile();

    executionContext = mockDeep<ExecutionContext>({
      switchToHttp: jest.fn().mockReturnThis(),
    });
    callHandler = mockDeep<CallHandler>({
      handle: jest.fn(),
    });
    interceptor = module.get<CompanionLinkStatusInterceptor>(
      CompanionLinkStatusInterceptor
    );
  });

  const mockDashboardApiCareRequest = buildMockDashboardWebhookCareRequest();

  const mockCompanionLink = buildMockCompanionLinkWithTasks({
    careRequestId: mockDashboardApiCareRequest.external_id,
  });

  const mockCompanionLinkExpired = buildMockCompanionLinkWithTasks({
    careRequestId: mockDashboardApiCareRequest.external_id,
    created: expiredDate,
  });

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const mockCRCompleteStatusExpired: CurrentStateDto = {
    id: 1,
    name: CareRequestStatusText.Complete,
    startedAt: subDays(new Date(), 45).toString(),
    createdAt: subDays(new Date(), 45).toString(),
    updatedAt: subDays(new Date(), 45).toString(),
    statusIndex: 0,
  };

  const mockCRCompleteStatus: CurrentStateDto = {
    id: 1,
    name: CareRequestStatusText.Complete,
    startedAt: subDays(new Date(), 1).toString(),
    createdAt: subDays(new Date(), 1).toString(),
    updatedAt: subDays(new Date(), 1).toString(),
    statusIndex: 0,
  };

  const mockCRArchivedtatusExpired: CurrentStateDto = {
    id: 1,
    name: CareRequestStatusText.Archived,
    startedAt: subDays(new Date(), 45).toString(),
    createdAt: subDays(new Date(), 45).toString(),
    updatedAt: subDays(new Date(), 45).toString(),
    statusIndex: 0,
  };

  const mockCRArchivedtatus: CurrentStateDto = {
    id: 1,
    name: CareRequestStatusText.Archived,
    startedAt: subDays(new Date(), 1).toString(),
    createdAt: subDays(new Date(), 1).toString(),
    updatedAt: subDays(new Date(), 1).toString(),
    statusIndex: 0,
  };

  const mockCompanionInfo =
    buildMockCompanionInfoFromCareRequest(mockCareRequest);

  describe(`${CompanionLinkStatusInterceptor.prototype.intercept.name}`, () => {
    describe(`Link exists`, () => {
      describe(`Care request exists`, () => {
        test(`Returns companion info`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLink
          );
          mockCompanionService.getCompanionInfoByCareRequestLink.mockResolvedValue(
            mockCompanionInfo
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLink.id },
            body: { careRequestInfo: null },
          });
          callHandler.handle.mockReturnValueOnce(
            new Observable((subscriber) => subscriber.next(mockCompanionInfo))
          );
          const observable = await interceptor.intercept(
            executionContext,
            callHandler
          );

          observable.subscribe();
          const result = await firstValueFrom(observable);

          expect(result).toStrictEqual(mockCompanionInfo);
          expect(
            executionContext.switchToHttp().getRequest().body.careRequestInfo
          ).toStrictEqual(mockCompanionInfo);
          expect(callHandler.handle).toBeCalledTimes(1);
        });
      });

      describe(`Care request exists Complete status OK`, () => {
        test(`Returns companion info (Complete status)`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLinkExpired
          );
          const states = mockCompanionInfo.currentStates;

          mockCompanionInfo.currentStates = [];
          mockCompanionInfo.currentStates.push(mockCRCompleteStatus);
          mockCompanionInfo.currentStates.push(mockCRArchivedtatusExpired);
          mockCompanionService.getCompanionInfoByCareRequestLink.mockResolvedValue(
            mockCompanionInfo
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLink.id },
            body: { careRequestInfo: null },
          });
          callHandler.handle.mockReturnValueOnce(
            new Observable((subscriber) => subscriber.next(mockCompanionInfo))
          );
          const observable = await interceptor.intercept(
            executionContext,
            callHandler
          );

          observable.subscribe();
          const result = await firstValueFrom(observable);

          expect(result).toStrictEqual(mockCompanionInfo);
          expect(
            executionContext.switchToHttp().getRequest().body.careRequestInfo
          ).toStrictEqual(mockCompanionInfo);
          expect(callHandler.handle).toBeCalledTimes(1);
          mockCompanionInfo.currentStates = states;
        });
      });

      describe(`Care request exists Archived status OK`, () => {
        test(`Returns companion info (Archive status)`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLinkExpired
          );
          const states = mockCompanionInfo.currentStates;

          mockCompanionInfo.currentStates = [];
          mockCompanionInfo.currentStates.push(mockCRCompleteStatusExpired);
          mockCompanionInfo.currentStates.push(mockCRArchivedtatus);
          mockCompanionService.getCompanionInfoByCareRequestLink.mockResolvedValue(
            mockCompanionInfo
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLink.id },
            body: { careRequestInfo: null },
          });
          callHandler.handle.mockReturnValueOnce(
            new Observable((subscriber) => subscriber.next(mockCompanionInfo))
          );
          const observable = await interceptor.intercept(
            executionContext,
            callHandler
          );

          observable.subscribe();
          const result = await firstValueFrom(observable);

          expect(result).toStrictEqual(mockCompanionInfo);
          expect(
            executionContext.switchToHttp().getRequest().body.careRequestInfo
          ).toStrictEqual(mockCompanionInfo);
          expect(callHandler.handle).toBeCalledTimes(1);
          mockCompanionInfo.currentStates = states;
        });

        test(`Returns companion info (Archived status no Complete status)`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLinkExpired
          );
          const states = mockCompanionInfo.currentStates;

          mockCompanionInfo.currentStates = [];
          mockCompanionInfo.currentStates.push(mockCRArchivedtatus);
          mockCompanionService.getCompanionInfoByCareRequestLink.mockResolvedValue(
            mockCompanionInfo
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLink.id },
            body: { careRequestInfo: null },
          });
          callHandler.handle.mockReturnValueOnce(
            new Observable((subscriber) => subscriber.next(mockCompanionInfo))
          );
          const observable = await interceptor.intercept(
            executionContext,
            callHandler
          );

          observable.subscribe();
          const result = await firstValueFrom(observable);

          expect(result).toStrictEqual(mockCompanionInfo);
          expect(
            executionContext.switchToHttp().getRequest().body.careRequestInfo
          ).toStrictEqual(mockCompanionInfo);
          expect(callHandler.handle).toBeCalledTimes(1);
          mockCompanionInfo.currentStates = states;
        });
      });

      describe(`Care request does not exist`, () => {
        test(`Throws error`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLink
          );
          mockCompanionService.getCompanionInfoByCareRequestLink.mockRejectedValue(
            new Error()
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLink.id },
          });
          const result = interceptor.intercept(executionContext, callHandler);

          await expect(result).rejects.toBeInstanceOf(Error);
        });
      });

      describe(`Link has expired`, () => {
        test(`Throws error`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLinkExpired
          );
          mockCompanionService.getCompanionInfoByCareRequestLink.mockResolvedValue(
            mockCompanionInfo
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLinkExpired.id },
            body: { careRequestInfo: null },
          });
          const result = interceptor.intercept(executionContext, callHandler);

          await expect(result).rejects.toBeInstanceOf(GoneException);
        });
      });

      describe(`Link has expired via Completed status`, () => {
        test(`Throws error (Complete status)`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLinkExpired
          );
          mockCompanionInfo.currentStates.push(mockCRCompleteStatusExpired);
          mockCompanionService.getCompanionInfoByCareRequestLink.mockResolvedValue(
            mockCompanionInfo
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLinkExpired.id },
            body: { careRequestInfo: null },
          });
          const result = interceptor.intercept(executionContext, callHandler);

          await expect(result).rejects.toBeInstanceOf(GoneException);
          mockCompanionInfo.currentStates = [];
        });
      });

      describe(`Link has expired via Archived status`, () => {
        test(`Throws error (Archived Status)`, async () => {
          mockCompanionService.findLinkById.mockResolvedValue(
            mockCompanionLinkExpired
          );
          mockCompanionInfo.currentStates.push(mockCRCompleteStatusExpired);
          mockCompanionInfo.currentStates.push(mockCRArchivedtatusExpired);
          mockCompanionService.getCompanionInfoByCareRequestLink.mockResolvedValue(
            mockCompanionInfo
          );
          (
            executionContext.switchToHttp().getRequest as jest.Mock
          ).mockReturnValue({
            params: { linkId: mockCompanionLinkExpired.id },
            body: { careRequestInfo: null },
          });
          const result = interceptor.intercept(executionContext, callHandler);

          await expect(result).rejects.toBeInstanceOf(GoneException);
          mockCompanionInfo.currentStates = [];
        });
      });
    });

    describe(`Link does not exist`, () => {
      test(`Throws error`, async () => {
        mockCompanionService.findLinkById.mockResolvedValue(null);
        (
          executionContext.switchToHttp().getRequest as jest.Mock
        ).mockReturnValue({
          params: { linkId: mockCompanionLink.id },
        });
        callHandler.handle.mockReturnValueOnce(
          new Observable((subscriber) => subscriber.next(mockCompanionInfo))
        );
        const observable = interceptor.intercept(executionContext, callHandler);

        await expect(observable).rejects.toBeInstanceOf(NotFoundException);
      });
    });

    describe(`Link data not present on paramaters`, () => {
      test(`Throws error`, async () => {
        (
          executionContext.switchToHttp().getRequest as jest.Mock
        ).mockReturnValue({
          params: { linkId: null },
        });
        const result = interceptor.intercept(executionContext, callHandler);

        await expect(result).rejects.toBeInstanceOf(BadRequestException);
      });
    });
  });
});
