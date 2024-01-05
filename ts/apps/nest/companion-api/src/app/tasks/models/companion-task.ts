import {
  CompanionTaskStatus,
  CompanionTaskStatusName,
  CompanionTaskType,
  Prisma,
} from '@prisma/client';
import { Priority } from '../../dashboard/types/priority';
import { isJsonArray, isJsonObject } from '../../utility/utils';
import { CompanionTaskWithStatuses } from '../../companion/dto/companion-task-status.dto';
import { QuestionTag } from '../../social-history/dto/question-answer.dto';

class TaskError extends Error {
  constructor() {
    super('Task does not match expected format.');
  }
}

export interface InsuranceImageTaskMetadata extends Prisma.JsonObject {
  insuranceStatuses: Partial<Record<Priority, CompanionTaskStatusName>>;
}

export class CompanionInsuranceImageTask implements CompanionTaskWithStatuses {
  id: number;
  companionLinkId: string;
  type: typeof CompanionTaskType.INSURANCE_CARD_IMAGES =
    CompanionTaskType.INSURANCE_CARD_IMAGES;
  metadata: InsuranceImageTaskMetadata;
  updatedAt: Date;
  createdAt: Date;
  statuses: CompanionTaskStatus[];

  static fromCompanionTask(
    task: CompanionTaskWithStatuses
  ): CompanionInsuranceImageTask {
    const {
      id,
      type,
      metadata,
      companionLinkId,
      updatedAt,
      createdAt,
      statuses,
    } = task;

    if (
      type !== CompanionTaskType.INSURANCE_CARD_IMAGES ||
      !isJsonObject(metadata) ||
      !isJsonObject(metadata?.insuranceStatuses)
    ) {
      throw new TaskError();
    }

    const primaryInsuranceStatus = metadata.insuranceStatuses['1']
      ? (metadata?.insuranceStatuses['1'] as CompanionTaskStatusName)
      : undefined;
    const secondaryInsuranceStatus = metadata.insuranceStatuses['2']
      ? (metadata.insuranceStatuses['2'] as CompanionTaskStatusName)
      : undefined;

    const parsedMetadata: InsuranceImageTaskMetadata = {
      insuranceStatuses: {},
    };

    if (primaryInsuranceStatus) {
      parsedMetadata.insuranceStatuses['1'] = primaryInsuranceStatus;
    }

    if (secondaryInsuranceStatus) {
      parsedMetadata.insuranceStatuses['2'] = secondaryInsuranceStatus;
    }

    return {
      id,
      type,
      companionLinkId,
      metadata: parsedMetadata,
      updatedAt,
      createdAt,
      statuses,
    };
  }
}

export class CompanionIdentificationImageTask
  implements CompanionTaskWithStatuses
{
  id: number;
  companionLinkId: string;
  type: typeof CompanionTaskType.IDENTIFICATION_IMAGE =
    CompanionTaskType.IDENTIFICATION_IMAGE;
  metadata: Prisma.JsonValue;
  updatedAt: Date;
  createdAt: Date;
  statuses: CompanionTaskStatus[];

  static fromCompanionTask(
    task: CompanionTaskWithStatuses
  ): CompanionIdentificationImageTask {
    const {
      id,
      type,
      metadata,
      companionLinkId,
      updatedAt,
      createdAt,
      statuses,
    } = task;

    if (type !== CompanionTaskType.IDENTIFICATION_IMAGE) {
      throw new TaskError();
    }

    return {
      id,
      type,
      companionLinkId,
      metadata,
      updatedAt,
      createdAt,
      statuses,
    };
  }
}

export class CompanionDefaultPharmacyTask implements CompanionTaskWithStatuses {
  id: number;
  companionLinkId: string;
  type: typeof CompanionTaskType.DEFAULT_PHARMACY =
    CompanionTaskType.DEFAULT_PHARMACY;
  metadata: Prisma.JsonValue;
  updatedAt: Date;
  createdAt: Date;
  statuses: CompanionTaskStatus[];

  static fromCompanionTask(
    task: CompanionTaskWithStatuses
  ): CompanionDefaultPharmacyTask {
    const {
      id,
      companionLinkId,
      type,
      metadata,
      updatedAt,
      createdAt,
      statuses,
    } = task;

    if (type !== CompanionTaskType.DEFAULT_PHARMACY) {
      throw new TaskError();
    }

    return {
      id,
      companionLinkId,
      type,
      metadata,
      updatedAt,
      createdAt,
      statuses,
    };
  }
}

export class CompanionMedicationHistoryConsentTask
  implements CompanionTaskWithStatuses
{
  id: number;
  companionLinkId: string;
  type: typeof CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY =
    CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY;
  metadata: Prisma.JsonValue;
  updatedAt: Date;
  createdAt: Date;
  statuses: CompanionTaskStatus[];

  static fromCompanionTask(
    task: CompanionTaskWithStatuses
  ): CompanionMedicationHistoryConsentTask {
    const {
      id,
      companionLinkId,
      type,
      metadata,
      updatedAt,
      createdAt,
      statuses,
    } = task;

    if (type !== CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY) {
      throw new TaskError();
    }

    return {
      id,
      companionLinkId,
      type,
      metadata,
      updatedAt,
      createdAt,
      statuses,
    };
  }
}

export type PcpTaskMetadataV1 = null;

export interface PcpTaskMetadataV2 extends Prisma.JsonObject {
  clinicalProviderId?: string;
  socialHistoryResponses: Partial<
    Record<QuestionTag.HAS_PCP | QuestionTag.HAS_SEEN_PCP_RECENTLY, boolean>
  >;
}

export type PcpTaskMetadata = PcpTaskMetadataV1 | PcpTaskMetadataV2;

export class CompanionPrimaryCareProviderTask
  implements CompanionTaskWithStatuses
{
  id: number;
  companionLinkId: string;
  type: typeof CompanionTaskType.PRIMARY_CARE_PROVIDER =
    CompanionTaskType.PRIMARY_CARE_PROVIDER;
  metadata: PcpTaskMetadata;
  updatedAt: Date;
  createdAt: Date;
  statuses: CompanionTaskStatus[];

  static fromCompanionTask(
    task: CompanionTaskWithStatuses
  ): CompanionPrimaryCareProviderTask {
    const {
      id,
      companionLinkId,
      type,
      metadata,
      updatedAt,
      createdAt,
      statuses,
    } = task;

    if (type !== CompanionTaskType.PRIMARY_CARE_PROVIDER) {
      throw new TaskError();
    }

    let parsedMetadata: PcpTaskMetadata;

    if (metadata === null) {
      parsedMetadata = null;
    } else if (
      isJsonObject(metadata) &&
      isJsonObject(metadata.socialHistoryResponses) &&
      (metadata.clinicalProviderId === undefined ||
        typeof metadata.clinicalProviderId === 'string')
    ) {
      const {
        [QuestionTag.HAS_PCP]: hasPcp,
        [QuestionTag.HAS_SEEN_PCP_RECENTLY]: hasSeenPcpRecently,
      } = metadata.socialHistoryResponses;

      const parsedHasPcp = typeof hasPcp === 'boolean' ? hasPcp : undefined;

      const parsedHasSeenPcpRecently =
        typeof hasSeenPcpRecently === 'boolean'
          ? hasSeenPcpRecently
          : undefined;

      parsedMetadata = {
        clinicalProviderId: metadata.clinicalProviderId?.toString(),
        socialHistoryResponses: {
          [QuestionTag.HAS_PCP]: parsedHasPcp,
          [QuestionTag.HAS_SEEN_PCP_RECENTLY]: parsedHasSeenPcpRecently,
        },
      };
    } else {
      throw new TaskError();
    }

    return {
      id,
      companionLinkId,
      type,
      metadata: parsedMetadata,
      updatedAt,
      createdAt,
      statuses,
    };
  }
}

export interface ConsentsTaskMetadata extends Prisma.JsonObject {
  completedDefinitionIds: number[];
}

export class CompanionConsentsTask implements CompanionTaskWithStatuses {
  id: number;
  companionLinkId: string;
  type: typeof CompanionTaskType.CONSENTS = CompanionTaskType.CONSENTS;
  metadata: ConsentsTaskMetadata;
  updatedAt: Date;
  createdAt: Date;
  statuses: CompanionTaskStatus[];

  static fromCompanionTask(
    task: CompanionTaskWithStatuses
  ): CompanionConsentsTask {
    const {
      id,
      companionLinkId,
      type,
      metadata,
      updatedAt,
      createdAt,
      statuses,
    } = task;

    if (
      type !== CompanionTaskType.CONSENTS ||
      !isJsonObject(metadata) ||
      !isJsonArray(metadata.completedDefinitionIds)
    ) {
      throw new TaskError();
    }

    const parseMetadata: ConsentsTaskMetadata = {
      completedDefinitionIds: [],
    };

    for (const definitionId of metadata.completedDefinitionIds) {
      if (definitionId !== null && definitionId !== undefined) {
        switch (typeof definitionId) {
          case 'string': {
            const parsedId = Number.parseInt(definitionId, 10);

            if (!isNaN(parsedId)) {
              parseMetadata.completedDefinitionIds.push(parsedId);
            } else {
              console.log('Invalid value in consents task metadata.'); // TODO
            }
            break;
          }
          case 'number':
            parseMetadata.completedDefinitionIds.push(definitionId);
            break;
          default:
            console.log('Invalid value in consents task metadata.'); // TODO
        }
      }
    }

    return {
      id,
      companionLinkId,
      type,
      metadata: parseMetadata,
      updatedAt,
      createdAt,
      statuses,
    };
  }
}

export type CompanionTask =
  | CompanionIdentificationImageTask
  | CompanionInsuranceImageTask
  | CompanionDefaultPharmacyTask
  | CompanionPrimaryCareProviderTask
  | CompanionConsentsTask
  | CompanionMedicationHistoryConsentTask;

export type DiscriminatedCompanionTaskDtoReturnType<Type> =
  Type extends typeof CompanionTaskType.IDENTIFICATION_IMAGE
    ? CompanionIdentificationImageTask
    : Type extends typeof CompanionTaskType.INSURANCE_CARD_IMAGES
    ? CompanionInsuranceImageTask
    : Type extends typeof CompanionTaskType.DEFAULT_PHARMACY
    ? CompanionDefaultPharmacyTask
    : Type extends typeof CompanionTaskType.PRIMARY_CARE_PROVIDER
    ? CompanionPrimaryCareProviderTask
    : Type extends typeof CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY
    ? CompanionMedicationHistoryConsentTask
    : Type extends typeof CompanionTaskType.CONSENTS
    ? CompanionConsentsTask
    : never;
