import { Test, TestingModule } from '@nestjs/testing';
import { VerifiedCallback } from 'passport-custom';
import { CompanionModule } from '../companion.module';
import {
  CompanionAuthenticationRequestBody,
  CompanionSessionExpressRequest,
  CompanionSessionUserModel,
  CompanionStrategy,
} from '../companion.strategy';
import { CompanionService } from '../companion.service';
import { mockCompanionService } from '../mocks/companion.service.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockDashboardPatient } from '../../dashboard/mocks/dashboard-patient.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import {
  GoneException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../common/companion.constants';
import { CommonModule } from '../../common/common.module';
import { CompanionLinkWithTasks } from '../interfaces/companion-link.interface';
import {
  buildMockCompanionLink,
  buildMockCompanionLinkWithTasks,
} from '../mocks/companion-link.mock';
import { buildMockSessionUser } from '../mocks/companion-session-user.mock';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../mocks/segment.service.mock';

describe(`${CompanionStrategy.name}`, () => {
  let strategy: CompanionStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(CompanionService)
      .useValue(mockCompanionService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .compile();

    strategy = module.get<CompanionStrategy>(CompanionStrategy);
  });

  const mockDone = jest.fn<
    VerifiedCallback,
    { error: Error; user: CompanionSessionUserModel }[]
  >();

  beforeEach(() => {
    mockReset(mockDone);
  });

  const mockCareRequest: CareRequestDto = buildMockCareRequest();
  const mockCareRequestWithoutPatient = buildMockCareRequest({
    patient: undefined,
  });

  const mockCompanionLink = buildMockCompanionLink({
    careRequestId: mockCareRequest.id,
  });

  const mockCompanionLinkWithTasks =
    buildMockCompanionLinkWithTasks(mockCompanionLink);

  const mockCompanionSessionUser = buildMockSessionUser({
    linkId: mockCompanionLink.id,
    careRequestId: mockCareRequest.id,
  });

  const mockUnauthenticatedRequestWithBody =
    mockDeep<CompanionSessionExpressRequest>({
      params: {
        linkId: mockCompanionLink.id,
      },
      body: {
        data: {
          dob: mockCareRequest.patient?.dob,
        },
      },
    });

  const mockUnauthenticatedRequestWithoutBody =
    mockDeep<CompanionSessionExpressRequest>({
      ...mockUnauthenticatedRequestWithBody,
      body: {},
    });

  const mockUnauthenticatedRequestWithBadBodyFormat =
    mockDeep<CompanionSessionExpressRequest>({
      ...mockUnauthenticatedRequestWithBody,
      body: {
        data: undefined,
        dob: mockCareRequest.patient?.dob,
      } as unknown as CompanionAuthenticationRequestBody,
    });

  const mockAuthenticatedRequestWithBody =
    mockDeep<CompanionSessionExpressRequest>({
      ...mockUnauthenticatedRequestWithBody,
      user: mockCompanionSessionUser,
    });

  const mockAuthenticatedRequestWithoutBody =
    mockDeep<CompanionSessionExpressRequest>({
      ...mockUnauthenticatedRequestWithoutBody,
      user: mockCompanionSessionUser,
      body: {},
    });

  const mockBadDobRequestRequest = mockDeep<CompanionSessionExpressRequest>({
    ...mockUnauthenticatedRequestWithBody,
    body: {
      data: {
        dob: '13/13/2920',
      },
    },
  });

  describe(`${CompanionStrategy.prototype.validate.name}`, () => {
    describe('Companion link not found', () => {
      beforeEach(() => {
        mockCompanionService.findLinkById.mockResolvedValue(null);
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );

        await strategy.validate(mockUnauthenticatedRequestWithBody, mockDone);

        expect(mockDone).toHaveBeenCalledWith(
          new NotFoundException(COMPANION_LINK_NOT_FOUND_ERROR_TEXT)
        );
      });
    });

    describe('Companion link found', () => {
      beforeEach(() => {
        mockCompanionService.findLinkById.mockResolvedValue(
          mockCompanionLinkWithTasks
        );
      });

      describe('Unauthenticated Request', () => {
        describe('Request body has authentication info', () => {
          test('DOB matches - calls done with correct user', async () => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );

            await strategy.validate(
              mockUnauthenticatedRequestWithBody,
              mockDone
            );

            expect(mockDone).toHaveBeenCalledWith(
              null,
              mockCompanionSessionUser
            );
          });

          test(`DOB does not match - throws ${UnauthorizedException.name}`, async () => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );

            await strategy.validate(mockBadDobRequestRequest, mockDone);

            expect(mockDone).toHaveBeenCalledWith(
              new UnauthorizedException('Authentication failed.')
            );
          });

          test(`Patient is undefined - cannot compare DOB - throws ${UnauthorizedException.name}`, async () => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequestWithoutPatient
            );

            await strategy.validate(mockBadDobRequestRequest, mockDone);

            expect(mockDone).toHaveBeenCalledWith(
              new UnauthorizedException('Authentication failed.')
            );
          });

          test(`Link is blocked - throws ${GoneException.name}`, async () => {
            mockCompanionService.isCompanionLinkAuthBlocked.mockResolvedValue(
              true
            );

            await strategy.validate(
              mockUnauthenticatedRequestWithBody,
              mockDone
            );

            expect(mockDone).toHaveBeenCalledWith(
              new GoneException('Link has been disabled.')
            );
          });

          test(`Care request does not exist - throws ${UnauthorizedException.name}`, async () => {
            mockDashboardService.getCareRequestById.mockResolvedValue(null);

            await strategy.validate(
              mockUnauthenticatedRequestWithBody,
              mockDone
            );

            expect(mockDone).toHaveBeenCalledWith(
              new UnauthorizedException(
                'Care request with ID associated to link was not found!'
              )
            );
          });

          test(`Care request has no DOB - throws ${UnauthorizedException.name}`, async () => {
            const mockCareRequest: CareRequestDto = buildMockCareRequest({
              patient: buildMockDashboardPatient(true, {
                dob: undefined,
              }).toPatientDto(),
            });

            mockDashboardService.getCareRequestById.mockResolvedValue({
              ...mockCareRequest,
            });

            await strategy.validate(mockBadDobRequestRequest, mockDone);

            expect(mockDone).toHaveBeenCalledWith(
              new UnauthorizedException('Authentication failed.')
            );
          });
        });

        describe('Request body does not have authentication info', () => {
          test(`throws ${UnauthorizedException.name}`, async () => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );

            await strategy.validate(
              mockUnauthenticatedRequestWithoutBody,
              mockDone
            );

            expect(mockDone).toHaveBeenCalledWith(
              new UnauthorizedException('Authentication failed.')
            );
          });
        });

        describe('Request body is poorly formatted', () => {
          test(`throws ${UnauthorizedException.name}`, async () => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );

            await strategy.validate(
              mockUnauthenticatedRequestWithBadBodyFormat,
              mockDone
            );

            expect(mockDone).toHaveBeenCalledWith(
              new UnauthorizedException(
                'User not authenticated and did not include the correct authentication information.'
              )
            );
          });
        });
      });

      describe('Authenticated Request', () => {
        describe('Request body has authentication info', () => {
          test('Session care request matches link care request - calls done with correct user', async () => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );

            await strategy.validate(mockAuthenticatedRequestWithBody, mockDone);

            expect(mockDone).toHaveBeenCalledWith(
              null,
              mockCompanionSessionUser
            );
          });

          test('Session care request does not match link care request - DOB in body matches - calls done with correct user', async () => {
            const mockCareRequestId = -1;

            mockDashboardService.getCareRequestById.mockResolvedValue({
              ...mockCareRequest,
              id: mockCareRequestId,
            });
            mockCompanionService.findLinkById.mockResolvedValueOnce({
              ...mockCompanionLink,
              careRequestId: mockCareRequestId,
            } as CompanionLinkWithTasks);

            await strategy.validate(mockAuthenticatedRequestWithBody, mockDone);

            expect(mockDone).toHaveBeenCalledWith<
              [null, CompanionSessionUserModel]
            >(null, {
              careRequestId: mockCareRequestId,
              linkId: mockCompanionSessionUser.linkId,
            });
          });
        });

        describe('Request body does not have authentication info', () => {
          test(`Session care request does not match link care request - throws ${UnauthorizedException.name}`, async () => {
            const mockCareRequestId = -1;

            mockDashboardService.getCareRequestById.mockResolvedValue({
              ...mockCareRequest,
              id: mockCareRequestId,
            });
            mockCompanionService.findLinkById.mockResolvedValueOnce({
              ...mockCompanionLink,
              careRequestId: mockCareRequestId,
            } as CompanionLinkWithTasks);

            await strategy.validate(
              mockAuthenticatedRequestWithoutBody,
              mockDone
            );

            expect(mockDone).toHaveBeenCalledWith(
              new UnauthorizedException('Authentication failed.')
            );
          });
        });
      });
    });
  });
});
