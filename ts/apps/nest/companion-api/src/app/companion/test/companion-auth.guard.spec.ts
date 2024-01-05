import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { mockDeep } from 'jest-mock-extended';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CommonModule } from '../../common/common.module';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { CompanionAuthGuard } from '../companion-auth.guard';
import { CompanionModule } from '../companion.module';
import { CompanionService } from '../companion.service';
import { CompanionSessionExpressRequest } from '../companion.strategy';
import {
  buildMockCompanionLink,
  buildMockCompanionLinkWithTasks,
} from '../mocks/companion-link.mock';
import { mockCompanionService } from '../mocks/companion.service.mock';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../mocks/segment.service.mock';

describe(`${CompanionAuthGuard.name}`, () => {
  let guard: CompanionAuthGuard;
  const MAX_INVALID_AUTH_COUNT =
    process.env.COMPANION_MAX_AUTH_ATTEMPTS === undefined
      ? 25
      : Number(process.env.COMPANION_MAX_AUTH_ATTEMPTS);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(CompanionService)
      .useValue(mockCompanionService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .compile();

    guard = module.get<CompanionAuthGuard>(CompanionAuthGuard);
  });

  const mockCareRequest: CareRequestDto = buildMockCareRequest();

  const mockCompanionLink = buildMockCompanionLink({
    careRequestId: mockCareRequest.id,
  });

  const mockCompanionLinkWithTasks =
    buildMockCompanionLinkWithTasks(mockCompanionLink);

  const mockCompanionLinkBlocked = buildMockCompanionLinkWithTasks({
    careRequestId: mockCareRequest.id,
    isBlocked: true,
  });

  const mockCompanionLinkBlockedMaxAttempts = buildMockCompanionLinkWithTasks({
    careRequestId: mockCareRequest.id,
    invalidAuthCount: MAX_INVALID_AUTH_COUNT,
  });

  const mockLogin = jest.fn().mockImplementation((_, done) => done(null));

  const mockAuthenticationSuccessfulContext = mockDeep<ExecutionContext>({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(
        mockDeep<CompanionSessionExpressRequest>({
          params: {
            linkId: faker.datatype.uuid(),
          },
          body: {
            data: {
              dob: mockCareRequest.patient?.dob,
            },
          },
          logIn: mockLogin,
          isAuthenticated: jest.fn().mockReturnValue(false),
        })
      ),
      getNext: jest.fn(),
      getResponse: jest.fn(),
    }),
  });

  const mockAlreadyAuthenticatedContext = mockDeep<ExecutionContext>({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(
        mockDeep<CompanionSessionExpressRequest>({
          params: {
            linkId: faker.datatype.uuid(),
          },
          body: {
            data: {
              dob: mockCareRequest.patient?.dob,
            },
          },
          logIn: mockLogin,
          isAuthenticated: jest.fn().mockReturnValue(true),
        })
      ),
      getNext: jest.fn(),
      getResponse: jest.fn(),
    }),
  });

  beforeEach(() => {
    mockLogin.mockClear();
  });

  const mockAuthenticationUnsuccessfulContext = mockDeep<ExecutionContext>({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(
        mockDeep<CompanionSessionExpressRequest>({
          params: {
            linkId: faker.datatype.uuid(),
          },
          body: {},
          logIn: mockLogin,
          isAuthenticated: jest.fn().mockReturnValue(false),
        })
      ),
      getNext: jest.fn(),
      getResponse: jest.fn(),
    }),
  });

  describe(`${CompanionAuthGuard.prototype.canActivate.name}`, () => {
    describe('Authentication Successful', () => {
      test('returns true', async () => {
        mockCompanionService.isCompanionLinkAuthBlocked.mockResolvedValue(
          false
        );
        mockCompanionService.findLinkById.mockResolvedValue(
          mockCompanionLinkWithTasks
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );

        const result = await guard.canActivate(
          mockAuthenticationSuccessfulContext
        );

        expect(result).toStrictEqual(true);
        expect(mockLogin).toBeCalledTimes(1);
      });
    });

    describe('Already Authenticated', () => {
      test('returns true', async () => {
        mockCompanionService.isCompanionLinkAuthBlocked.mockResolvedValue(
          false
        );
        mockCompanionService.findLinkById.mockResolvedValue(
          mockCompanionLinkWithTasks
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );

        const result = await guard.canActivate(mockAlreadyAuthenticatedContext);

        expect(result).toStrictEqual(true);
        expect(mockLogin).toBeCalledTimes(0);
      });
    });

    describe('Authentication Unsuccessful', () => {
      test('canActivate rejects - throws error', async () => {
        mockCompanionService.findLinkById.mockResolvedValue(
          mockCompanionLinkWithTasks
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );

        const result = guard.canActivate(mockAuthenticationUnsuccessfulContext);

        await expect(result).rejects.toBeInstanceOf(Error);
        expect(mockLogin).toBeCalledTimes(0);
      });
    });

    describe('Authentication Unsuccessful Max Auth Attempts', () => {
      test('canActivate rejects - max auth attempts', async () => {
        mockCompanionService.findLinkById.mockResolvedValue(
          mockCompanionLinkBlockedMaxAttempts
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );

        const result = guard.canActivate(mockAuthenticationUnsuccessfulContext);

        await expect(result).rejects.toBeInstanceOf(Error);
        expect(mockLogin).toBeCalledTimes(0);
      });
    });

    describe('Authentication Unsuccessful Link Blocked', () => {
      test('canActivate rejects - link blocked', async () => {
        mockCompanionService.findLinkById.mockResolvedValue(
          mockCompanionLinkBlocked
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );

        const result = guard.canActivate(mockAuthenticationUnsuccessfulContext);

        await expect(result).rejects.toBeInstanceOf(Error);
        expect(mockLogin).toBeCalledTimes(0);
      });
    });
  });
});
