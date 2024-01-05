import {
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { CaravanModule } from '../caravan.module';
import { CaravanConsentsAdapter } from '../caravan-consents.adapter';
import { CaravanRequester } from '../caravan.requester';
import { mockCaravanRequester } from '../mocks/caravan.requester.mock';
import { buildMockConsentDefinitionsQuery } from '../mocks/consent-definition-query.mock';
import { AxiosError, AxiosResponse } from 'axios';
import { mockDeep } from 'jest-mock-extended';
import * as faker from 'faker';
import { ConsentDefinitionsQuery } from '../types/consent-definition-query';
import { CaravanConsentDefinition } from '../types/caravan.definition';
import { buildMockConsentCapturesQuery } from '../mocks/consent-captures-query.mock';
import { buildMockCaravanConsentDefinition } from '../mocks/caravan.definition.mock';
import {
  buildMockCaravanConsentCapture,
  buildMockCreateCaptureCaravanRequest,
} from '../mocks/caravan.capture.mock';
import { CaravanConsentCapture } from '../types/caravan.capture';
import { CaravanConsentOptions } from '../types/caravan.consent-options';
import { buildMockCaravanConsentOptions } from '../mocks/caravan.consent-options.mock';

describe(`${CaravanConsentsAdapter.name}`, () => {
  let app: INestApplication | undefined;
  let adapter: CaravanConsentsAdapter;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CaravanModule, CommonModule],
    })
      .overrideProvider(CaravanRequester)
      .useValue(mockCaravanRequester)
      .compile();

    adapter = moduleRef.get<CaravanConsentsAdapter>(CaravanConsentsAdapter);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  const mockNotFoundError: AxiosError = mockDeep<AxiosError>({
    isAxiosError: true,
    response: mockDeep<AxiosResponse>({
      status: HttpStatus.NOT_FOUND,
      statusText: 'Internal service error.',
      data: {},
    }),
  } as unknown as AxiosError);

  test(`should be defined correctly`, () => {
    expect(adapter).toBeInstanceOf(CaravanConsentsAdapter);
  });

  describe(`${CaravanConsentsAdapter.prototype.getDefinitions.name}`, () => {
    const signerIds: ConsentDefinitionsQuery['signerIds'] = [
      faker.datatype.number().toString(),
      faker.datatype.number().toString(),
    ];
    const mockDefinitionsQuery = buildMockConsentDefinitionsQuery({
      signerIds,
    });
    const mockDefinitionPlain = buildMockCaravanConsentDefinition();

    const mockAxiosDefinitionsResponse = {
      data: [mockDefinitionPlain],
    } as AxiosResponse<CaravanConsentDefinition[]>;

    describe('Request is successful', () => {
      beforeEach(() => {
        mockCaravanRequester.executeCaravanRequest.mockResolvedValue(
          mockAxiosDefinitionsResponse
        );
      });

      describe('Signer IDs are included in query', () => {
        test(`should return definitions`, async () => {
          const result = await adapter.getDefinitions(mockDefinitionsQuery);

          const { active, state, signerIds, serviceLine, languageId } =
            mockDefinitionsQuery;
          const expectedPathParam = `/consents/api/definitions?active=${active}&state=${state}&service_line=${serviceLine}&language_id=${languageId}&signer_ids=${signerIds}`;

          expect(result).toStrictEqual([mockDefinitionPlain]);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledWith(expectedPathParam, {
            method: 'GET',
          });
        });
      });

      describe('Signer IDs are not included in query', () => {
        test(`should return definitions`, async () => {
          const mockDefinitionsQueryWithoutSignerIds = {
            ...mockDefinitionsQuery,
          };

          delete mockDefinitionsQueryWithoutSignerIds.signerIds;
          const result = await adapter.getDefinitions(
            mockDefinitionsQueryWithoutSignerIds
          );

          const { active, state, serviceLine, languageId } =
            mockDefinitionsQueryWithoutSignerIds;
          const expectedPathParam = `/consents/api/definitions?active=${active}&state=${state}&service_line=${serviceLine}&language_id=${languageId}`;

          expect(result).toStrictEqual([mockDefinitionPlain]);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledWith(expectedPathParam, {
            method: 'GET',
          });
        });
      });

      test(`formats signer IDs`, async () => {
        await adapter.getDefinitions(mockDefinitionsQuery);
        expect(mockCaravanRequester.executeCaravanRequest).toHaveBeenCalledWith(
          expect.stringContaining(`signer_ids=${signerIds.join(',')}`),
          expect.any(Object)
        );
      });

      test(`default value for active is true`, async () => {
        await adapter.getDefinitions({
          ...mockDefinitionsQuery,
          active: undefined,
        });
        expect(mockCaravanRequester.executeCaravanRequest).toHaveBeenCalledWith(
          expect.stringContaining(`active=true`),
          expect.any(Object)
        );
      });
    });

    describe('Request is unsuccessful', () => {
      describe(`${NotFoundException.name}`, () => {
        beforeEach(() => {
          mockCaravanRequester.executeCaravanRequest.mockRejectedValue(
            mockNotFoundError
          );
        });

        test(`should return empty array`, async () => {
          const result = await adapter.getDefinitions(mockDefinitionsQuery);

          expect(result).toStrictEqual([]);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledTimes(1);
        });
      });

      describe(`Other errors`, () => {
        beforeEach(() => {
          mockCaravanRequester.executeCaravanRequest.mockRejectedValue(
            new Error()
          );
        });

        test(`should throw error`, async () => {
          await expect(
            adapter.getDefinitions(mockDefinitionsQuery)
          ).rejects.toBeInstanceOf(Error);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe(`${CaravanConsentsAdapter.prototype.getCaptures.name}`, () => {
    const mockCapturesQuery = buildMockConsentCapturesQuery();
    const mockCapturePlain = buildMockCaravanConsentCapture();

    const mockAxiosCapturesResponse = {
      data: [mockCapturePlain],
    } as AxiosResponse<CaravanConsentCapture[]>;

    describe('Request is successful', () => {
      beforeEach(() => {
        mockCaravanRequester.executeCaravanRequest.mockResolvedValue(
          mockAxiosCapturesResponse
        );
      });

      test(`should return captures`, async () => {
        const result = await adapter.getCaptures(mockCapturesQuery);

        expect(result).toStrictEqual([mockCapturePlain]);
        expect(
          mockCaravanRequester.executeCaravanRequest
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Request is unsuccessful', () => {
      describe(`${NotFoundException.name}`, () => {
        beforeEach(() => {
          mockCaravanRequester.executeCaravanRequest.mockRejectedValue(
            mockNotFoundError
          );
        });

        test(`should return empty array`, async () => {
          const result = await adapter.getCaptures(mockCapturesQuery);

          expect(result).toStrictEqual([]);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledTimes(1);
        });
      });

      describe(`Other errors`, () => {
        beforeEach(() => {
          mockCaravanRequester.executeCaravanRequest.mockRejectedValue(
            new Error()
          );
        });

        test(`should throw error`, async () => {
          await expect(
            adapter.getCaptures(mockCapturesQuery)
          ).rejects.toBeInstanceOf(Error);
          expect(
            mockCaravanRequester.executeCaravanRequest
          ).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe(`${CaravanConsentsAdapter.prototype.getOptions.name}`, () => {
    const mockOptions = buildMockCaravanConsentOptions();

    const mockAxiosOptionsResponse = {
      data: mockOptions,
    } as AxiosResponse<CaravanConsentOptions>;

    describe('Request is successful', () => {
      beforeEach(() => {
        mockCaravanRequester.executeCaravanRequest.mockResolvedValue(
          mockAxiosOptionsResponse
        );
      });

      test(`should return options`, async () => {
        const result = await adapter.getOptions();

        expect(result).toStrictEqual(mockOptions);
        expect(
          mockCaravanRequester.executeCaravanRequest
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Request is unsuccessful', () => {
      beforeEach(() => {
        mockCaravanRequester.executeCaravanRequest.mockRejectedValue(
          new Error()
        );
      });

      test(`should throw error`, async () => {
        await expect(adapter.getOptions()).rejects.toBeInstanceOf(Error);
        expect(
          mockCaravanRequester.executeCaravanRequest
        ).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe(`${CaravanConsentsAdapter.prototype.createCapture.name}`, () => {
    const mockCapturePlain = buildMockCaravanConsentCapture();
    const mockCaptureRequest = buildMockCreateCaptureCaravanRequest();

    const mockAxiosCreateCaptureResponse = {
      data: [mockCapturePlain],
    } as AxiosResponse<CaravanConsentCapture[]>;

    describe('Request is successful', () => {
      beforeEach(() => {
        mockCaravanRequester.executeCaravanRequest.mockResolvedValue(
          mockAxiosCreateCaptureResponse
        );
      });

      test(`should return created capture`, async () => {
        const result = await adapter.createCapture(mockCaptureRequest);

        expect(result).toStrictEqual([mockCapturePlain]);

        expect(
          mockCaravanRequester.executeCaravanRequest
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Request is unsuccessful', () => {
      beforeEach(() => {
        mockCaravanRequester.executeCaravanRequest.mockRejectedValue(
          new Error()
        );
      });

      test(`should throw error`, async () => {
        await expect(
          adapter.createCapture(mockCaptureRequest)
        ).rejects.toBeInstanceOf(Error);
        expect(
          mockCaravanRequester.executeCaravanRequest
        ).toHaveBeenCalledTimes(1);
      });
    });
  });
});
