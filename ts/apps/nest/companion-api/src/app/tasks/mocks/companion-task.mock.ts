import * as faker from 'faker';
import { CompanionTaskWithStatuses } from '../../companion/dto/companion-task-status.dto';
import {
  CompanionTaskStatus,
  CompanionTaskStatusName,
  CompanionTaskType,
} from '@prisma/client';
import {
  CompanionIdentificationImageTask,
  CompanionInsuranceImageTask,
  CompanionDefaultPharmacyTask,
  CompanionPrimaryCareProviderTask,
  InsuranceImageTaskMetadata,
  CompanionMedicationHistoryConsentTask,
  PcpTaskMetadata,
  CompanionConsentsTask,
  ConsentsTaskMetadata,
} from '../models/companion-task';
import { QuestionTag } from '../../social-history/dto/question-answer.dto';

export const buildMockCompanionTask = (
  init: Partial<CompanionTaskWithStatuses> = {}
): CompanionTaskWithStatuses => ({
  id: faker.datatype.number(),
  companionLinkId: faker.datatype.uuid(),
  type: CompanionTaskType.IDENTIFICATION_IMAGE,
  updatedAt: faker.datatype.datetime(),
  createdAt: faker.datatype.datetime(),
  metadata: null,
  statuses: [
    buildMockCompanionTaskStatus({ name: CompanionTaskStatusName.NOT_STARTED }),
  ],
  ...init,
});

export const buildMockCompanionIdentificationTask = (
  init: Partial<CompanionIdentificationImageTask> = {}
): CompanionIdentificationImageTask => ({
  ...buildMockCompanionTask(),
  type: CompanionTaskType.IDENTIFICATION_IMAGE,
  metadata: null,
  ...init,
});

export const buildMockInsuranceTaskMetadata = (
  init: Partial<InsuranceImageTaskMetadata> = {}
): InsuranceImageTaskMetadata => ({
  insuranceStatuses: {
    '1': CompanionTaskStatusName.NOT_STARTED,
  },
  ...init,
});

export const buildMockCompanionInsuranceTask = (
  init: Partial<CompanionInsuranceImageTask> = {}
): CompanionInsuranceImageTask => ({
  ...buildMockCompanionTask(),
  type: CompanionTaskType.INSURANCE_CARD_IMAGES,
  metadata: buildMockInsuranceTaskMetadata(init.metadata),
  ...init,
});

export const buildMockCompanionDefaultPharmacyTask = (
  init: Partial<CompanionDefaultPharmacyTask> = {}
): CompanionDefaultPharmacyTask => ({
  ...buildMockCompanionTask(),
  type: CompanionTaskType.DEFAULT_PHARMACY,
  ...init,
});

export const buildMockPrimaryCareProviderTask = (
  init: Partial<CompanionPrimaryCareProviderTask> = {}
): CompanionPrimaryCareProviderTask => {
  const { metadata: metadataInit, ...rest } = init;

  return {
    ...buildMockCompanionTask(),
    type: CompanionTaskType.PRIMARY_CARE_PROVIDER,
    metadata:
      metadataInit !== null
        ? buildMockPrimaryCareProviderTaskMetadata(metadataInit)
        : metadataInit,
    ...rest,
  };
};

export const buildMockPrimaryCareProviderTaskMetadata = (
  init: Partial<PcpTaskMetadata> = {}
): PcpTaskMetadata => {
  return {
    clinicalProviderId: undefined,
    socialHistoryResponses: {
      [QuestionTag.HAS_PCP]: undefined,
      [QuestionTag.HAS_SEEN_PCP_RECENTLY]: undefined,
    },
    ...init,
  };
};

export const buildMockCompanionMedicationConsentTask = (
  init: Partial<CompanionMedicationHistoryConsentTask> = {}
): CompanionMedicationHistoryConsentTask => ({
  ...buildMockCompanionTask(),
  type: CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY,
  ...init,
});

export const buildMockConsentsTaskMetadata = (
  init: Partial<ConsentsTaskMetadata> = {}
): ConsentsTaskMetadata => ({
  completedDefinitionIds: new Array(4)
    .fill(0)
    .map(() => faker.datatype.number()),
  ...init,
});

export const buildMockCompanionConsentsTask = (
  init: Partial<CompanionConsentsTask> = {}
): CompanionConsentsTask => {
  const { metadata: metadataInit, ...rest } = init;

  return {
    ...buildMockCompanionTask(),
    type: CompanionTaskType.CONSENTS,
    metadata: buildMockConsentsTaskMetadata(metadataInit),
    ...rest,
  };
};

export const buildMockCompanionTaskStatus = (
  init: Partial<CompanionTaskStatus>
): CompanionTaskStatus => ({
  id: faker.datatype.number(),
  companionTaskId: faker.datatype.number(),
  createdAt: faker.datatype.datetime(),
  name: CompanionTaskStatusName.NOT_STARTED,
  ...init,
});
