import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { mockDeep, mockReset } from 'jest-mock-extended';
import {
  buildMockRiskAssessment,
  mockRiskAssessment,
} from './mocks/risk-assessment.service.mock';
import { RiskAssessmentController } from '../risk-assessment.controller';
import RiskAssessmentsModule from '../risk-assessment.module';
import RiskAssessmentService from '../risk-assessment.service';

describe(`${RiskAssessmentController.name}`, () => {
  let controller: RiskAssessmentController;
  const mockRiskAssessmentService = mockDeep<RiskAssessmentService>();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RiskAssessmentsModule],
    })
      .overrideProvider(RiskAssessmentService)
      .useValue(mockRiskAssessmentService)
      .compile();

    controller = module.get<RiskAssessmentController>(RiskAssessmentController);
  });

  beforeEach(async () => {
    mockReset(mockRiskAssessmentService);
  });

  describe(`${RiskAssessmentController.prototype.fetchAll.name}`, () => {
    it(`get empty risk assessment`, async () => {
      mockRiskAssessmentService.fetch.mockResolvedValue(null);

      const result = await controller.fetchAll(17902);
      expect(mockRiskAssessmentService.fetch).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true, data: null });
    });

    it(`gets risk assessment`, async () => {
      mockRiskAssessmentService.fetch.mockResolvedValue(mockRiskAssessment);

      const result = await controller.fetchAll(614009);
      expect(mockRiskAssessmentService.fetch).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true, data: mockRiskAssessment });
    });

    it('get risk assessments error', async () => {
      mockRiskAssessmentService.fetch.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchAll(12893);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${RiskAssessmentController.prototype.fetch.name}`, () => {
    it(`get empty risk assessment`, async () => {
      mockRiskAssessmentService.fetch.mockResolvedValue(null);

      const result = await controller.fetch(614009, 17920);

      expect(mockRiskAssessmentService.fetch).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true, data: null });
    });

    it(`gets risk assessment`, async () => {
      mockRiskAssessmentService.fetch.mockResolvedValue(mockRiskAssessment);

      const result = await controller.fetch(614009, 17920);
      expect(mockRiskAssessmentService.fetch).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true, data: mockRiskAssessment });
    });

    it('get risk assessment error', async () => {
      mockRiskAssessmentService.fetch.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetch(12893, 234);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${RiskAssessmentController.prototype.create.name}`, () => {
    it(`throws error if care request doesn't exist`, async () => {
      mockRiskAssessmentService.create.mockResolvedValue(null);

      try {
        await controller.create(614009, buildMockRiskAssessment());
        expect(mockRiskAssessmentService.create).toBeCalledTimes(1);
      } catch (error) {
        expect(error).toHaveProperty(
          'message',
          'Error occured while creating risk Assessment.'
        );
      }
    });

    it(`create risk assessment`, async () => {
      mockRiskAssessmentService.create.mockResolvedValue(mockRiskAssessment);

      const result = await controller.create(614009, buildMockRiskAssessment());
      expect(mockRiskAssessmentService.create).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true, data: mockRiskAssessment });
    });
  });

  describe(`${RiskAssessmentController.prototype.update.name}`, () => {
    it(`throws error if care request or risk assessment doesn't exist`, async () => {
      mockRiskAssessmentService.update.mockResolvedValue(null);
      try {
        await controller.update(614009, 17920, buildMockRiskAssessment());
        expect(mockRiskAssessmentService.update).toBeCalledTimes(1);
      } catch (error) {
        expect(error).toHaveProperty(
          'message',
          'Error occured while updating risk Assessment.'
        );
      }
    });

    it(`updates risk assessment`, async () => {
      mockRiskAssessmentService.update.mockResolvedValue(mockRiskAssessment);

      const result = await controller.update(
        614009,
        17920,
        buildMockRiskAssessment()
      );
      expect(mockRiskAssessmentService.update).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true, data: mockRiskAssessment });
    });
  });

  describe(`${RiskAssessmentController.prototype.delete.name}`, () => {
    it(`throws error if care request or risk assessment doesn't exist`, async () => {
      mockRiskAssessmentService.delete.mockResolvedValue(null);
      try {
        await controller.delete(614009, 17920);
        expect(mockRiskAssessmentService.delete).toBeCalledTimes(1);
      } catch (error) {
        expect(error).toHaveProperty(
          'message',
          'Error occured while deleting Risk Assessment.'
        );
      }
    });

    it(`deletes risk assessment`, async () => {
      mockRiskAssessmentService.delete.mockResolvedValue({
        success: true,
      });

      const result = await controller.delete(614009, 17920);
      expect(mockRiskAssessmentService.delete).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true });
    });
  });
});
