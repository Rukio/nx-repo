import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep, mockReset } from 'jest-mock-extended';
import {
  CareRequest,
  CareRequestAPIResponse,
} from '@*company-data-covered*/consumer-web-types';
import CareRequestController from '../care-request.controller';
import CareRequestService from '../care-request.service';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import {
  CARE_REQUEST_MOCK,
  CARE_REQUEST_RESPONSE_MOCK,
  TIME_WINDOWS_AVAILABILITIES_MOCK,
} from '../../station/test/mocks/station.mapper.mock';

describe('CareRequestController', () => {
  let controller: CareRequestController;
  const mockCareRequestService = mockDeep<CareRequestService>();
  const response: CareRequestAPIResponse<CareRequest> = {
    success: true,
    data: CARE_REQUEST_RESPONSE_MOCK,
  };

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CareRequestController],
      providers: [CareRequestService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(CareRequestService)
      .useValue(mockCareRequestService)
      .compile();

    controller = app.get<CareRequestController>(CareRequestController);
  });

  beforeEach(async () => {
    mockReset(mockCareRequestService);
  });

  describe('CareRequestController', () => {
    it('create Care Request', async () => {
      mockCareRequestService.create.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      expect(await controller.create(CARE_REQUEST_MOCK)).toEqual(response);
    });

    it('fetch Care Request by id', async () => {
      mockCareRequestService.fetch.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      expect(await controller.fetch('id')).toEqual(response);
    });

    it('update Care Request', async () => {
      mockCareRequestService.update.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      expect(await controller.update('id', CARE_REQUEST_MOCK)).toEqual(
        response
      );
    });

    it('patch Care Request', async () => {
      mockCareRequestService.patch.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      expect(await controller.patch('id', CARE_REQUEST_MOCK)).toEqual(response);
    });

    it('change Care Request status', async () => {
      mockCareRequestService.updateStatus.mockResolvedValue(true);

      expect(
        await controller.updateStatus('id', {
          status: 'archived',
          comment: 'Test',
          shiftTeamId: 0,
          reassignmentReasonText: '',
          reassignmentReasonOtherText: '',
        })
      ).toEqual({ success: true, data: true });
    });

    it('Accept Care Request if feasible', async () => {
      mockCareRequestService.acceptIfFeasible.mockResolvedValue(true);
      expect(
        await controller.acceptIfFeasible('id', {
          comment: 'foo',
          shiftTeamId: 123,
          reassignmentReasonText: 'bar',
          reassignmentReasonOtherText: '',
          skipFeasibilityCheck: false,
        })
      ).toEqual({
        success: true,
        data: true,
      });
    });

    it('Accept Care Request if feasible error', async () => {
      const payload = {
        comment: 'foo',
        shiftTeamId: 123,
        reassignmentReasonText: 'bar',
        reassignmentReasonOtherText: '',
        skipFeasibilityCheck: true,
      };
      jest
        .spyOn(mockCareRequestService, 'acceptIfFeasible')
        .mockImplementation(() => {
          throw new Error();
        });
      await expect(async () => {
        await controller.acceptIfFeasible('id', payload);
      }).rejects.toThrow(HttpException);
      expect(mockCareRequestService.acceptIfFeasible).toHaveBeenCalledWith(
        'id',
        payload
      );
    });

    it('fetch time windows availability by Care Request id', async () => {
      mockCareRequestService.getTimeWindowsAvailability.mockResolvedValue(
        TIME_WINDOWS_AVAILABILITIES_MOCK
      );
      expect(await controller.getTimeWindowsAvailability('id')).toEqual({
        success: true,
        data: TIME_WINDOWS_AVAILABILITIES_MOCK,
      });
    });

    it('fetch time windows availability by Care Request id error', async () => {
      jest
        .spyOn(mockCareRequestService, 'getTimeWindowsAvailability')
        .mockImplementation(() => {
          throw new Error();
        });
      await expect(async () => {
        await controller.getTimeWindowsAvailability('id');
      }).rejects.toThrow(HttpException);
      expect(
        mockCareRequestService.getTimeWindowsAvailability
      ).toHaveBeenCalledWith('id');
    });

    it('Update care request channel item', async () => {
      mockCareRequestService.assignChannelItem.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      expect(
        await controller.assignChannelItem('id', {
          channelItemId: 1,
        })
      ).toEqual(response);
    });

    it('create Care Request create error', async () => {
      mockCareRequestService.create.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.create(CARE_REQUEST_RESPONSE_MOCK);
      }).rejects.toThrow(HttpException);
    });

    it('Retrieve care request error', async () => {
      jest.spyOn(mockCareRequestService, 'fetch').mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await controller.fetch('id');
      }).rejects.toThrow(HttpException);
      expect(mockCareRequestService.fetch).toHaveBeenCalledWith('id');
    });

    it('Update care request error', async () => {
      jest.spyOn(mockCareRequestService, 'update').mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await controller.update('id', CARE_REQUEST_MOCK);
      }).rejects.toThrow(HttpException);
      expect(mockCareRequestService.update).toHaveBeenCalledWith(
        'id',
        CARE_REQUEST_MOCK
      );
    });

    it('Patch care request error', async () => {
      jest.spyOn(mockCareRequestService, 'patch').mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await controller.patch('id', CARE_REQUEST_MOCK);
      }).rejects.toThrow(HttpException);
      expect(mockCareRequestService.patch).toHaveBeenCalledWith(
        'id',
        CARE_REQUEST_MOCK
      );
    });

    it('Update care request status error', async () => {
      jest
        .spyOn(mockCareRequestService, 'updateStatus')
        .mockImplementation(() => {
          throw new Error();
        });
      const updateStatusPayload = {
        status: 'archived',
        comment: 'Test',
        shiftTeamId: 0,
        reassignmentReasonText: '',
        reassignmentReasonOtherText: '',
      };
      await expect(async () => {
        await controller.updateStatus('id', updateStatusPayload);
      }).rejects.toThrow(HttpException);
      expect(mockCareRequestService.updateStatus).toHaveBeenCalledWith(
        'id',
        updateStatusPayload
      );
    });

    it('Update care request channel item error', async () => {
      jest
        .spyOn(mockCareRequestService, 'assignChannelItem')
        .mockImplementation(() => {
          throw new Error();
        });
      await expect(async () => {
        await controller.assignChannelItem('id', { channelItemId: 1 });
      }).rejects.toThrow(HttpException);
      expect(mockCareRequestService.assignChannelItem).toHaveBeenCalledWith(
        'id',
        1
      );
    });
  });
});
