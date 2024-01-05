import * as faker from 'faker';
import { plainToClass } from 'class-transformer';
import {
  DashboardPatient,
  PlainDashboardPatient,
} from '../types/dashboard-patient';

function buildMockDashboardPatient(
  transform: false,
  userDefinedValues?: Partial<DashboardPatient>
): PlainDashboardPatient;
function buildMockDashboardPatient(
  transform: true,
  userDefinedValues?: Partial<DashboardPatient>
): DashboardPatient;
function buildMockDashboardPatient<T extends boolean>(
  transform: T,
  userDefinedValues?: Partial<DashboardPatient>
): DashboardPatient | PlainDashboardPatient {
  const patient: PlainDashboardPatient = {
    id: faker.datatype.number(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    mobile_number: faker.phone.phoneNumber(),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    user_id: faker.datatype.number(),
    patient_email: faker.internet.exampleEmail(),
    is_user: true,
    dob: '1994-09-22',
    gender: 'male',
    account_id: faker.datatype.number(),
    avatar: null,
    source_type: '',
    unsynched_changes: null,
    age: faker.datatype.number(),
    phone_number: faker.phone.phoneNumber(),
    voicemail_consent: true,
    ehr_id: faker.datatype.number(),
    ...userDefinedValues,
  };

  if (transform) {
    return plainToClass(DashboardPatient, patient);
  }

  return patient;
}

export { buildMockDashboardPatient };
