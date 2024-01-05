import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import AssignTeamService from '../assign-team.service';
import AssignTeamController from '../assign-team.controller';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import {
  MOCK_ASSIGN_TEAM_CREATE_ETA_RESPONSE,
  MOCK_ASSIGN_TEAM_PARAMS,
  MOCK_ETA_PARAMS,
} from './mocks/assign-team.mock';

describe('AssignTeamController', () => {
  let controller: AssignTeamController;
  const mockAssignTeamService = mockDeep<AssignTeamService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [AssignTeamController],
      providers: [AssignTeamService],
    })
      .overrideProvider(AssignTeamService)
      .useValue(mockAssignTeamService)
      .compile();

    controller = app.get<AssignTeamController>(AssignTeamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${AssignTeamService.prototype.update.name}`, () => {
    it('should return success', async () => {
      mockAssignTeamService.update.mockResolvedValue({ success: true });

      expect(await controller.update(MOCK_ASSIGN_TEAM_PARAMS)).toHaveProperty(
        'success',
        true
      );
    });

    it('throw httpException on update', async () => {
      jest.spyOn(mockAssignTeamService, 'update').mockImplementation(() => {
        throw new Error('error');
      });
      expect(mockAssignTeamService.update).toHaveBeenCalledWith(
        612985,
        MOCK_ASSIGN_TEAM_PARAMS
      );
      await expect(async () => {
        await controller.update(MOCK_ASSIGN_TEAM_PARAMS);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${AssignTeamService.prototype.createEta.name}`, () => {
    it('should return success for Eta range', async () => {
      mockAssignTeamService.createEta.mockResolvedValue(
        MOCK_ASSIGN_TEAM_CREATE_ETA_RESPONSE
      );
      const response = {
        success: true,
        data: MOCK_ASSIGN_TEAM_CREATE_ETA_RESPONSE,
      };

      expect(await controller.createEta(MOCK_ETA_PARAMS)).toEqual(response);
    });

    it('throw httpException on createEta', async () => {
      jest.spyOn(mockAssignTeamService, 'createEta').mockImplementation(() => {
        throw new Error('error');
      });
      expect(mockAssignTeamService.createEta).toHaveBeenCalledWith(
        614009,
        MOCK_ETA_PARAMS
      );
      await expect(async () => {
        await controller.createEta(MOCK_ETA_PARAMS);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${AssignTeamService.prototype.removeAssignment.name}`, () => {
    it('should remove assignments of care request', async () => {
      expect(await controller.removeAssignment('careRequestId')).toBeFalsy();
      expect(mockAssignTeamService.removeAssignment).toHaveBeenCalled();
    });

    it('throw httpException on remove assignments of care request', async () => {
      jest
        .spyOn(mockAssignTeamService, 'removeAssignment')
        .mockImplementation(() => {
          throw new Error('error');
        });
      expect(mockAssignTeamService.removeAssignment).toHaveBeenCalledWith(
        'careRequestId'
      );
      await expect(async () => {
        await controller.removeAssignment('careRequestId');
      }).rejects.toThrow(HttpException);
    });
  });
});
