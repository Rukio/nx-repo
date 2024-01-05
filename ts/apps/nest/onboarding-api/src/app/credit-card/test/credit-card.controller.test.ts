import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule, HttpException } from '@nestjs/common';
import { mockDeep } from 'jest-mock-extended';
import {
  CareRequestAPIResponse,
  CreditCard,
} from '@*company-data-covered*/consumer-web-types';
import CreditCardController from '../credit-card.controller';
import CreditCardService from '../credit-card.service';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import {
  MOCK_CARE_REQUEST_ID,
  MOCK_CREDIT_CARD_ERRORS_TRANSFORMED,
  MOCK_CREDIT_CARD_PARAMS,
  MOCK_ERROR_MESSAGE,
  MOCK_PATIENT_ID,
  MOCK_SINGLE_ERROR_MESSAGE,
  MOCK_STATION_CREDIT_CARD_EMPTY_RESPONSE_DATA,
  MOCK_STATION_CREDIT_CARD_ERROR,
  MOCK_STATION_CREDIT_CARD_ERRORS_DATA,
  MOCK_STATION_CREDIT_CARD_IFRAME_ERRORS_DATA,
  MOCK_STATION_CREDIT_CARD_SIGNLE_ERROR_DATA,
  MOCK_UPDATE_CREDIT_CARD_PARAMS,
} from './mocks/credit-card.mock';

describe(`${CreditCardController.name}`, () => {
  let controller: CreditCardController;
  const mockCreditCardService = mockDeep<CreditCardService>();
  const response: CareRequestAPIResponse<CreditCard> = {
    success: true,
    data: MOCK_CREDIT_CARD_PARAMS,
  };

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardController],
      providers: [CreditCardService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(CreditCardService)
      .useValue(mockCreditCardService)
      .compile();

    controller = app.get<CreditCardController>(CreditCardController);
  });

  describe(`${CreditCardController.prototype.create.name}`, () => {
    it(`create a credit card`, async () => {
      mockCreditCardService.create.mockResolvedValue(MOCK_CREDIT_CARD_PARAMS);
      expect(await controller.create(MOCK_CREDIT_CARD_PARAMS)).toEqual(
        response
      );
    });

    it('throws an error on create credit card', async () => {
      jest.spyOn(mockCreditCardService, 'create').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.create(MOCK_CREDIT_CARD_PARAMS);
      }).rejects.toThrow(HttpException);
      expect(mockCreditCardService.create).toHaveBeenCalledWith(
        MOCK_CREDIT_CARD_PARAMS
      );
    });

    it('should return array of errors when station returns error list on create credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'create')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_ERRORS_DATA);
      await expect(async () => {
        await controller.create(MOCK_CREDIT_CARD_PARAMS);
      }).rejects.toEqual(
        new HttpException({ message: MOCK_CREDIT_CARD_ERRORS_TRANSFORMED }, 422)
      );
    });

    it('should return error message on create credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'create')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_EMPTY_RESPONSE_DATA);
      await expect(async () => {
        await controller.create(MOCK_CREDIT_CARD_PARAMS);
      }).rejects.toEqual(
        new HttpException({ message: MOCK_ERROR_MESSAGE }, 422)
      );
    });

    it('should return single error message on create credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'create')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_SIGNLE_ERROR_DATA);
      await expect(async () => {
        await controller.create(MOCK_CREDIT_CARD_PARAMS);
      }).rejects.toEqual(
        new HttpException({ message: MOCK_SINGLE_ERROR_MESSAGE }, 422)
      );
    });
  });

  describe(`${CreditCardController.prototype.update.name}`, () => {
    it('update a credit card', async () => {
      const creditCardId = 3124;
      mockCreditCardService.update.mockResolvedValue(MOCK_CREDIT_CARD_PARAMS);
      expect(
        await controller.update(creditCardId, MOCK_UPDATE_CREDIT_CARD_PARAMS)
      ).toEqual(response);
    });

    it('throws an error on update credit card', async () => {
      jest.spyOn(mockCreditCardService, 'update').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.update(
          MOCK_PATIENT_ID,
          MOCK_UPDATE_CREDIT_CARD_PARAMS
        );
      }).rejects.toThrow(HttpException);
      expect(mockCreditCardService.update).toHaveBeenCalledWith(
        MOCK_PATIENT_ID,
        MOCK_UPDATE_CREDIT_CARD_PARAMS
      );
    });

    it('should return array of errors when station returns error list on update credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'update')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_ERRORS_DATA);
      await expect(async () => {
        await controller.update(
          MOCK_PATIENT_ID,
          MOCK_UPDATE_CREDIT_CARD_PARAMS
        );
      }).rejects.toEqual(
        new HttpException({ message: MOCK_CREDIT_CARD_ERRORS_TRANSFORMED }, 422)
      );
    });

    it('should return error message on update credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'update')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_ERROR);
      await expect(async () => {
        await controller.update(
          MOCK_PATIENT_ID,
          MOCK_UPDATE_CREDIT_CARD_PARAMS
        );
      }).rejects.toEqual(
        new HttpException({ message: MOCK_ERROR_MESSAGE }, 422)
      );
    });

    it('should return single error message on update credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'update')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_SIGNLE_ERROR_DATA);
      await expect(async () => {
        await controller.update(
          MOCK_PATIENT_ID,
          MOCK_UPDATE_CREDIT_CARD_PARAMS
        );
      }).rejects.toEqual(
        new HttpException({ message: MOCK_SINGLE_ERROR_MESSAGE }, 422)
      );
    });
  });

  describe(`${CreditCardController.prototype.fetch.name}`, () => {
    it('fetch credit card by patient id', async () => {
      const careRequestId = null;
      mockCreditCardService.fetch.mockResolvedValue(MOCK_CREDIT_CARD_PARAMS);
      expect(await controller.fetch(MOCK_PATIENT_ID, careRequestId)).toEqual(
        response
      );
    });

    it('throws an error on fetch credit card', async () => {
      jest.spyOn(mockCreditCardService, 'fetch').mockImplementation(() => {
        throw new Error();
      });
      const careRequestId = null;
      await expect(async () => {
        await controller.fetch(MOCK_PATIENT_ID, careRequestId);
      }).rejects.toThrow(HttpException);
      expect(mockCreditCardService.fetch).toHaveBeenCalledWith(
        MOCK_PATIENT_ID,
        careRequestId
      );
    });

    it('should return array of errors when station returns error list on fetch credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'fetch')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_ERRORS_DATA);
      await expect(async () => {
        await controller.fetch(MOCK_PATIENT_ID, MOCK_CARE_REQUEST_ID);
      }).rejects.toEqual(
        new HttpException({ message: MOCK_CREDIT_CARD_ERRORS_TRANSFORMED }, 422)
      );
    });

    it('should return error message on fetch credit card', async () => {
      jest
        .spyOn(mockCreditCardService, 'fetch')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_ERROR);
      await expect(async () => {
        await controller.fetch(MOCK_PATIENT_ID, MOCK_CARE_REQUEST_ID);
      }).rejects.toEqual(
        new HttpException({ message: MOCK_ERROR_MESSAGE }, 422)
      );
    });
  });

  describe(`${CreditCardController.prototype.delete.name}`, () => {
    it('delete a credit card', async () => {
      mockCreditCardService.update.mockResolvedValue(MOCK_CREDIT_CARD_PARAMS);
      const result = await controller.delete('id');
      expect(result.success).toEqual(true);
    });

    it('throws an error on delete credit card', async () => {
      jest.spyOn(mockCreditCardService, 'delete').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.delete('id');
      }).rejects.toThrow(HttpException);
      expect(mockCreditCardService.delete).toHaveBeenCalledWith('id');
    });
  });

  describe(`${CreditCardController.prototype.iframe.name}`, () => {
    it('fetch iframe by patient id', async () => {
      const iframeRes = { url: 'test' };
      mockCreditCardService.getIframeUrl.mockResolvedValue(iframeRes);
      expect(await controller.iframe(MOCK_PATIENT_ID)).toEqual({
        data: iframeRes,
        success: true,
      });
    });

    it('throws an error on getting iframe', async () => {
      jest
        .spyOn(mockCreditCardService, 'getIframeUrl')
        .mockImplementation(() => {
          throw new Error();
        });
      await expect(async () => {
        await controller.iframe(MOCK_PATIENT_ID);
      }).rejects.toThrow(HttpException);
      expect(mockCreditCardService.getIframeUrl).toHaveBeenCalledWith(
        MOCK_PATIENT_ID
      );
    });

    it('should return an error when station returns error on get iframe', async () => {
      jest
        .spyOn(mockCreditCardService, 'getIframeUrl')
        .mockRejectedValue(MOCK_STATION_CREDIT_CARD_IFRAME_ERRORS_DATA);
      await expect(async () => {
        await controller.iframe(MOCK_PATIENT_ID);
      }).rejects.toEqual(
        new HttpException({ message: { error: 'Ehr record not found' } }, 404)
      );
    });
  });
});
