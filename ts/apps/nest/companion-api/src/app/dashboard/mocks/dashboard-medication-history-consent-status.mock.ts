import * as faker from 'faker';
import { DashboardMedicationHistoryConsentStatus } from '../types/dashboard-medication-history-consent-status';

export function buildMockDashboardMedicationHistoryConsentStatus(
  userDefinedValues: Partial<DashboardMedicationHistoryConsentStatus> = {}
): DashboardMedicationHistoryConsentStatus {
  return {
    medication_history_consent: faker.datatype.boolean(),
    ...userDefinedValues,
  };
}
