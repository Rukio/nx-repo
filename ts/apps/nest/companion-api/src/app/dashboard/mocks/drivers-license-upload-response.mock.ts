import * as faker from 'faker';
import {
  DriversLicense,
  DashboardDriversLicense,
} from '../types/drivers-license-upload-response';

const buildMockDriversLicense = (
  userDefinedValues: Partial<DriversLicense> = {}
): DriversLicense => {
  return {
    url: faker.internet.url(),
    thumb: {
      url: faker.internet.url(),
    },
    small: {
      url: faker.internet.url(),
    },
    medium: {
      url: faker.internet.url(),
    },
    ...userDefinedValues,
  };
};

export const buildMockDriversLicenseUploadResponse = (
  userDefinedValues: Partial<DashboardDriversLicense> = {}
): DashboardDriversLicense => {
  return {
    id: faker.datatype.number(),
    patient_id: faker.datatype.number(),
    license: buildMockDriversLicense(userDefinedValues.license),
    created_at: faker.datatype.datetime().toISOString(),
    updated_at: faker.datatype.datetime().toISOString(),
    ...userDefinedValues,
  };
};
