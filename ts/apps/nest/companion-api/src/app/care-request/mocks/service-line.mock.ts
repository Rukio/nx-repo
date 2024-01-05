import * as faker from 'faker';
import { AppointmentType } from '../../dashboard/types/dashboard-care-request';
import { ServiceLine } from '../dto/service-line.dto';

export const buildMockAppointmentType = (
  userDefinedValues: Partial<AppointmentType> = {}
): AppointmentType => ({
  id: faker.datatype.uuid(),
  name: faker.lorem.word(),
  ...userDefinedValues,
});

export const buildMockServiceLine = (
  userDefinedValues: Partial<ServiceLine> = {}
): ServiceLine => ({
  id: faker.datatype.number(),
  name: faker.lorem.word(),
  newPatientAppointmentType: buildMockAppointmentType(),
  existingPatientAppointmentType: buildMockAppointmentType(),
  outOfNetworkInsurance: faker.datatype.boolean(),
  requireCheckout: faker.datatype.boolean(),
  requireConsentSignature: faker.datatype.boolean(),
  requireMedicalNecessity: faker.datatype.boolean(),
  ...userDefinedValues,
});
