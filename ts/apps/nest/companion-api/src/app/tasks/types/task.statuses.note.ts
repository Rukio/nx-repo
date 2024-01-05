import { CompanionTaskType } from '@prisma/client';
import { TaskLabelText } from '../enums/task-label-text';

export type DisplayedTask = {
  [CompanionTaskType.IDENTIFICATION_IMAGE]: TaskLabelText.ID;
  [CompanionTaskType.INSURANCE_CARD_IMAGES]: TaskLabelText.Insurance;
  [CompanionTaskType.PRIMARY_CARE_PROVIDER]: TaskLabelText.PCP;
  [CompanionTaskType.DEFAULT_PHARMACY]: TaskLabelText.Pharmacy;
  [CompanionTaskType.CONSENTS]: TaskLabelText.Consents;
  [CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY]: TaskLabelText.Medications;
};

export type TaskLabel =
  | TaskLabelText.ID
  | TaskLabelText.Insurance
  | TaskLabelText.PCP
  | TaskLabelText.Pharmacy
  | TaskLabelText.Consents
  | TaskLabelText.Medications;
