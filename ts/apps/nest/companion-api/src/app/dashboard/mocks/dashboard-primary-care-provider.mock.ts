import * as faker from 'faker';
import { DashboardPrimaryCareProvider } from '../types/dashboard-primary-care-provider';

export function buildMockDashboardPrimaryCareProvider(
  userDefinedValues: Partial<DashboardPrimaryCareProvider> = {}
): DashboardPrimaryCareProvider {
  return {
    patient_has_pcp: faker.datatype.boolean(),
    primaryCareProvider: {
      clinicalProviderId: faker.datatype.number().toString(),
    },
    ...userDefinedValues,
  };
}
