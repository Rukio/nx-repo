import { DashboardClinicalProvider } from '../types/dashboard-clinical-provider';
import * as faker from 'faker';
export const buildMockDashboardClinicalProvider = (
  userDefinedValues: Partial<DashboardClinicalProvider> = {}
): DashboardClinicalProvider => {
  return {
    firstname: faker.datatype.string(),
    lastname: faker.datatype.string(),
    distance: faker.datatype.string(),
    state: faker.datatype.string(),
    address: faker.datatype.string(),
    clinicalproviderid: faker.datatype.string(),
    name: faker.datatype.string(),
    zip: faker.datatype.string(),
    city: faker.datatype.string(),
    fax: faker.datatype.string(),
    phone: faker.datatype.string(),
    clinicalprovidernpi: faker.datatype.string(),
    ...userDefinedValues,
  };
};
