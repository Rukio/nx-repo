import {
  CompanionTaskStatusName,
  CompanionTaskType,
  Prisma,
} from '@prisma/client';
import {
  buildMockCompanionConsentsTask,
  buildMockCompanionTask,
  buildMockInsuranceTaskMetadata,
  buildMockPrimaryCareProviderTask,
} from '../../tasks/mocks/companion-task.mock';
import {
  CompanionIdentificationImageTask,
  CompanionInsuranceImageTask,
  CompanionDefaultPharmacyTask,
  CompanionPrimaryCareProviderTask,
  CompanionMedicationHistoryConsentTask,
  PcpTaskMetadata,
  CompanionConsentsTask,
} from '../../tasks/models/companion-task';
import { QuestionTag } from '../../social-history/dto/question-answer.dto';

describe(`${CompanionInsuranceImageTask.name}`, () => {
  test('Initializes correctly', () => {
    const result = new CompanionInsuranceImageTask();

    expect(result.type).toStrictEqual(CompanionTaskType.INSURANCE_CARD_IMAGES);
  });

  describe(`${CompanionInsuranceImageTask.fromCompanionTask.name}`, () => {
    test('should map correctly', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.INSURANCE_CARD_IMAGES,
        metadata: buildMockInsuranceTaskMetadata({
          insuranceStatuses: {
            '1': CompanionTaskStatusName.NOT_STARTED,
            '2': CompanionTaskStatusName.NOT_STARTED,
          },
        }),
      });

      const result = CompanionInsuranceImageTask.fromCompanionTask(mockTask);

      expect(result).toStrictEqual(mockTask);
    });

    test('should not include insurance status if not there originally', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.INSURANCE_CARD_IMAGES,
        metadata: buildMockInsuranceTaskMetadata({
          insuranceStatuses: {},
        }),
      });

      const result = CompanionInsuranceImageTask.fromCompanionTask(mockTask);

      expect(result.metadata.insuranceStatuses).not.toHaveProperty('1');
      expect(result.metadata.insuranceStatuses).not.toHaveProperty('2');
    });

    test('should throw error for null metadata', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.INSURANCE_CARD_IMAGES,
        metadata: null,
      });

      expect(() =>
        CompanionInsuranceImageTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });

    test('should throw error for null metadata.insuranceStatuses', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.INSURANCE_CARD_IMAGES,
        metadata: {
          insuranceStatuses: null,
        },
      });

      expect(() =>
        CompanionInsuranceImageTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });

    test('should throw error for wrong type', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.IDENTIFICATION_IMAGE,
      });

      expect(() =>
        CompanionInsuranceImageTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });
  });
});

describe(`${CompanionConsentsTask.name}`, () => {
  test('Initializes correctly', () => {
    const result = new CompanionConsentsTask();

    expect(result.type).toStrictEqual(CompanionTaskType.CONSENTS);
  });

  describe(`${CompanionConsentsTask.fromCompanionTask.name}`, () => {
    test('should map correctly', () => {
      const mockTask = buildMockCompanionConsentsTask();

      const result = CompanionConsentsTask.fromCompanionTask(mockTask);

      expect(result).toStrictEqual(mockTask);
    });

    test('should parse strings to numbers', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.CONSENTS,
        metadata: {
          completedDefinitionIds: ['1'],
        },
      });

      const result = CompanionConsentsTask.fromCompanionTask(mockTask);

      expect(result.metadata.completedDefinitionIds).toStrictEqual([1]);
    });

    test('should exclude non-numeric values', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.CONSENTS,
        metadata: {
          completedDefinitionIds: [
            'ahhh',
            null,
            true,
            undefined,
            {},
          ] as Prisma.JsonArray,
        },
      });

      const result = CompanionConsentsTask.fromCompanionTask(mockTask);

      expect(result.metadata.completedDefinitionIds).toStrictEqual([]);
    });

    test('should throw error for null metadata', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.CONSENTS,
        metadata: null,
      });

      expect(() =>
        CompanionConsentsTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });

    test('should throw error for null metadata.insuranceStatuses', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.CONSENTS,
        metadata: {
          insuranceStatuses: null,
        },
      });

      expect(() =>
        CompanionConsentsTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });

    test('should throw error for wrong type', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.IDENTIFICATION_IMAGE,
      });

      expect(() =>
        CompanionConsentsTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });
  });
});

describe(`${CompanionIdentificationImageTask.name}`, () => {
  test('should initialize correctly', () => {
    const result = new CompanionIdentificationImageTask();

    expect(result.type).toStrictEqual(CompanionTaskType.IDENTIFICATION_IMAGE);
  });

  describe(`${CompanionIdentificationImageTask.fromCompanionTask.name}`, () => {
    test('should map correctly', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.IDENTIFICATION_IMAGE,
      });

      const result =
        CompanionIdentificationImageTask.fromCompanionTask(mockTask);

      expect(result).toStrictEqual(mockTask);
    });

    test('should throw error for wrong type', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.INSURANCE_CARD_IMAGES,
      });

      expect(() =>
        CompanionIdentificationImageTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });
  });
});

describe(`${CompanionDefaultPharmacyTask.name}`, () => {
  test('should initialize correctly', () => {
    const result = new CompanionDefaultPharmacyTask();

    expect(result.type).toStrictEqual(CompanionTaskType.DEFAULT_PHARMACY);
  });

  describe(`${CompanionDefaultPharmacyTask.fromCompanionTask.name}`, () => {
    test('should map correctly', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.DEFAULT_PHARMACY,
      });

      const result = CompanionDefaultPharmacyTask.fromCompanionTask(mockTask);

      expect(result).toStrictEqual(mockTask);
    });

    test('should throw error for wrong type', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.IDENTIFICATION_IMAGE,
      });

      expect(() =>
        CompanionDefaultPharmacyTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });
  });
});

describe(`${CompanionPrimaryCareProviderTask.name}`, () => {
  test('should initialize correctly', () => {
    const result = new CompanionPrimaryCareProviderTask();

    expect(result.type).toStrictEqual(CompanionTaskType.PRIMARY_CARE_PROVIDER);
  });

  describe(`${CompanionPrimaryCareProviderTask.fromCompanionTask.name}`, () => {
    test('should map correctly', () => {
      const mockTask = buildMockPrimaryCareProviderTask();

      const result =
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask);

      expect(result).toStrictEqual(mockTask);
    });

    test('should map correctly when metadata is null', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: null,
      });
      const expectedMetadata: PcpTaskMetadata = null;

      const result =
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask);

      expect(result.metadata).toStrictEqual(expectedMetadata);
    });

    test('should map correctly when HAS_PCP is true', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: { socialHistoryResponses: { [QuestionTag.HAS_PCP]: true } },
      });
      const expectedMetadata: PcpTaskMetadata = {
        clinicalProviderId: undefined,
        socialHistoryResponses: {
          [QuestionTag.HAS_PCP]: true,
          [QuestionTag.HAS_SEEN_PCP_RECENTLY]: undefined,
        },
      };

      const result =
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask);

      expect(result.metadata).toStrictEqual(expectedMetadata);
    });

    test('should map correctly when HAS_PCP is false', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: { socialHistoryResponses: { [QuestionTag.HAS_PCP]: false } },
      });
      const expectedMetadata: PcpTaskMetadata = {
        clinicalProviderId: undefined,
        socialHistoryResponses: {
          [QuestionTag.HAS_PCP]: false,
          [QuestionTag.HAS_SEEN_PCP_RECENTLY]: undefined,
        },
      };

      const result =
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask);

      expect(result.metadata).toStrictEqual(expectedMetadata);
    });

    test('should map correctly when HAS_SEEN_PCP_RECENTLY is true', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: {
          socialHistoryResponses: { [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true },
        },
      });
      const expectedMetadata: PcpTaskMetadata = {
        clinicalProviderId: undefined,
        socialHistoryResponses: {
          [QuestionTag.HAS_PCP]: undefined,
          [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
        },
      };

      const result =
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask);

      expect(result.metadata).toStrictEqual(expectedMetadata);
    });

    test('should map correctly when HAS_SEEN_PCP_RECENTLY is false', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: {
          socialHistoryResponses: {
            [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
          },
        },
      });
      const expectedMetadata: PcpTaskMetadata = {
        clinicalProviderId: undefined,
        socialHistoryResponses: {
          [QuestionTag.HAS_PCP]: undefined,
          [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
        },
      };

      const result =
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask);

      expect(result.metadata).toStrictEqual(expectedMetadata);
    });

    test('should map correctly when socialHistoryResponses are undefined', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: { socialHistoryResponses: {} },
      });
      const expectedMetadata: PcpTaskMetadata = {
        clinicalProviderId: undefined,
        socialHistoryResponses: {
          [QuestionTag.HAS_PCP]: undefined,
          [QuestionTag.HAS_SEEN_PCP_RECENTLY]: undefined,
        },
      };

      const result =
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask);

      expect(result.metadata).toStrictEqual(expectedMetadata);
    });

    test('should throw error for wrong type', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.IDENTIFICATION_IMAGE,
      });

      expect(() =>
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });

    test('should throw error for metadata in an unknown format', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.PRIMARY_CARE_PROVIDER,
        metadata: [] as never,
      });

      expect(() =>
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });

    test('should throw error for metadata.socialHistoryResponses in an unknown format', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: {
          socialHistoryResponses: [] as never,
        },
      });

      expect(() =>
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });

    test('should throw error for metadata.clinicalProviderId in an unknown format', () => {
      const mockTask = buildMockPrimaryCareProviderTask({
        metadata: {
          clinicalProviderId: [] as never,
          socialHistoryResponses: {},
        },
      });

      expect(() =>
        CompanionPrimaryCareProviderTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });
  });
});

describe(`${CompanionMedicationHistoryConsentTask.name}`, () => {
  test('should initialize correctly', () => {
    const result = new CompanionMedicationHistoryConsentTask();

    expect(result.type).toStrictEqual(
      CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY
    );
  });

  describe(`${CompanionMedicationHistoryConsentTask.fromCompanionTask.name}`, () => {
    test('should map correctly', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY,
      });

      const result =
        CompanionMedicationHistoryConsentTask.fromCompanionTask(mockTask);

      expect(result).toStrictEqual(mockTask);
    });

    test('should throw error for wrong type', () => {
      const mockTask = buildMockCompanionTask({
        type: CompanionTaskType.INSURANCE_CARD_IMAGES,
      });

      expect(() =>
        CompanionMedicationHistoryConsentTask.fromCompanionTask(mockTask)
      ).toThrowError();
    });
  });
});
