import { DashboardPharmacy } from '../types/dashboard-default-pharmacy';
import * as faker from 'faker';
export function buildMockDashboardPharmacy(
  userDefinedValues: Partial<DashboardPharmacy> = {}
): DashboardPharmacy {
  return {
    acceptfax: faker.datatype.string(),
    address1: faker.datatype.string(),
    address2: faker.datatype.string(),
    city: faker.datatype.string(),
    clinicalproviderid: faker.datatype.number(),
    clinicalprovidername: faker.datatype.string(),
    defaultpharmacy: faker.datatype.string(),
    faxnumber: faker.datatype.string(),
    pharmacytype: faker.datatype.string(),
    phonenumber: faker.datatype.string(),
    receivertype: faker.datatype.string(),
    state: faker.datatype.string(),
    zip: faker.datatype.string(),
    ...userDefinedValues,
  };
}
