import { Test, TestingModule } from '@nestjs/testing';
import { CompanionModule } from '../companion.module';
import { CompanionService } from '../companion.service';
import { DashboardWebhookDtoV1 } from '../dto/dashboard-webhook-v1.dto';
import { WebhookResponseType } from '../dto/webhook-response.dto';
import { mockCompanionService } from '../mocks/companion.service.mock';
import { CompanionController } from '../companion.controller';
import {
  buildMockDashboardWebhookCareRequest,
  buildMockDashboardWebhookV2CareRequest,
  buildMockDashboardWebhookV2EtaUpdate,
} from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { CommonModule } from '../../common/common.module';
import { mockStatsigService } from '../../statsig/mocks/statsig.service.mock';
import { buildMockCompanionLink } from '../mocks/companion-link.mock';
import { mockRedis } from '../../redis/mocks/redis.mock';
import {
  mutexAcquireMock,
  mutexReleaseMock,
} from '../../../testUtils/jest.setup';
import { CompanionLinkNotFoundException } from '../common';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { IOREDIS_CLIENT_TOKEN } from '../../redis';

describe(`${CompanionController.name}`, () => {
  let controller: CompanionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(CompanionService)
      .useValue(mockCompanionService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .overrideProvider(IOREDIS_CLIENT_TOKEN)
      .useValue(mockRedis)
      .compile();

    controller = module.get<CompanionController>(CompanionController);
  });

  const mockDashboardApiCareRequest = buildMockDashboardWebhookCareRequest();

  const mockDashboardWebhookDto: DashboardWebhookDtoV1 = {
    care_request: JSON.stringify(mockDashboardApiCareRequest),
  };

  const mockDashboardWebhookDtoV2 = buildMockDashboardWebhookV2CareRequest();

  const mockCompanionLink = buildMockCompanionLink({
    careRequestId: mockDashboardApiCareRequest.external_id,
  });

  const mockDashboardApiCareRequestOnScene =
    buildMockDashboardWebhookCareRequest({
      request_status: CareRequestStatusText.OnScene,
    });

  const mockDashboardApiCareRequestOnRoute =
    buildMockDashboardWebhookCareRequest({
      request_status: CareRequestStatusText.OnRoute,
    });

  const mockDashboardWebhookDtoOnScene: DashboardWebhookDtoV1 = {
    care_request: JSON.stringify(mockDashboardApiCareRequestOnScene),
  };

  const mockDashboardWebhookDtoOnRoute: DashboardWebhookDtoV1 = {
    care_request: JSON.stringify(mockDashboardApiCareRequestOnRoute),
  };

  describe(`${CompanionController.prototype.handleDashboardWebhook.name}`, () => {
    test(`should use mutex`, async () => {
      mockCompanionService.createCompanionLink.mockResolvedValue(
        mockCompanionLink.id
      );

      await controller.handleDashboardWebhook(mockDashboardWebhookDto);

      expect(mutexAcquireMock).toHaveBeenCalledTimes(1);
      expect(mutexReleaseMock).toHaveBeenCalledTimes(1);
    });

    test(`should receive V2 DTO and create companion link`, async () => {
      mockCompanionService.createCompanionLink.mockResolvedValue(
        mockCompanionLink.id
      );
      await controller.handleDashboardWebhook(mockDashboardWebhookDtoV2);
      expect(mockCompanionService.createCompanionLink).toBeCalled();
    });

    test(`should release mutex if error is thrown`, async () => {
      mockCompanionService.createCompanionLink.mockRejectedValue(
        new CompanionLinkNotFoundException()
      );

      await expect(
        controller.handleDashboardWebhook(mockDashboardWebhookDto)
      ).rejects.toBeInstanceOf(CompanionLinkNotFoundException);
      expect(mutexAcquireMock).toHaveBeenCalledTimes(1);
      expect(mutexReleaseMock).toHaveBeenCalledTimes(1);
    });

    describe(`Successfully creating Link`, () => {
      test(`should create link`, async () => {
        mockCompanionService.createCompanionLink.mockResolvedValue(
          mockCompanionLink.id
        );

        await controller.handleDashboardWebhook(mockDashboardWebhookDto);

        expect(mockCompanionService.createCompanionLink).toHaveBeenCalledTimes(
          1
        );
      });

      test(`should return link`, async () => {
        mockCompanionService.createCompanionLink.mockResolvedValue(
          mockCompanionLink.id
        );

        const result = await controller.handleDashboardWebhook(
          mockDashboardWebhookDto
        );

        expect(result).toStrictEqual({
          type: WebhookResponseType.CompanionCreateLink,
          linkId: mockCompanionLink.id,
        });
      });
    });

    describe(`Create Link Unsuccessful`, () => {
      test(`should throw error`, async () => {
        mockCompanionService.createCompanionLink.mockRejectedValue(new Error());

        const result = controller.handleDashboardWebhook(
          mockDashboardWebhookDto
        );

        await expect(result).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`On Scene Request Successful`, () => {
      test(`should call handler`, async () => {
        await controller.handleDashboardWebhook(mockDashboardWebhookDtoOnScene);

        expect(mockCompanionService.onCareRequestOnScene).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe(`On Scene Request Unsuccessful`, () => {
      test(`should throw error`, async () => {
        mockCompanionService.onCareRequestOnScene.mockRejectedValue(
          new Error()
        );

        const result = controller.handleDashboardWebhook(
          mockDashboardWebhookDtoOnScene
        );

        await expect(result).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`On Route Request Successful`, () => {
      test(`should call handler`, async () => {
        await controller.handleDashboardWebhook(mockDashboardWebhookDtoOnRoute);

        expect(mockCompanionService.onCareRequestOnRoute).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe(`On Route Request Unsuccessful`, () => {
      test(`should throw error`, async () => {
        mockCompanionService.onCareRequestOnRoute.mockRejectedValue(
          new Error()
        );

        const result = controller.handleDashboardWebhook(
          mockDashboardWebhookDtoOnRoute
        );

        await expect(result).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${CompanionController.prototype.handleEtaRangeWebhook.name}`, () => {
    describe('if no eta range is passed', () => {
      it('does not call handleEtaRangeEvent', async () => {
        await controller.handleDashboardWebhook(mockDashboardWebhookDtoV2);
        expect(mockCompanionService.handleEtaRangeEvent).toBeCalledTimes(0);
      });
    });

    describe('if eta range is passed', () => {
      const mockDashboardWebhookDtoV2Eta =
        buildMockDashboardWebhookV2EtaUpdate();

      it('calls handleEtaRangeEvent', async () => {
        await controller.handleEtaRangeWebhook(mockDashboardWebhookDtoV2Eta);
        expect(mockCompanionService.handleEtaRangeEvent).toBeCalledTimes(1);
      });
    });
  });

  describe(`${CompanionController.prototype.authenticate.name}`, () => {
    test(`should return nothing`, async () => {
      const result = controller.authenticate();

      expect(result).toBeUndefined();
    });
  });
});
