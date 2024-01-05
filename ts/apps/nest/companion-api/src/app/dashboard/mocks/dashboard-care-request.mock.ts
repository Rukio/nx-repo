import * as faker from 'faker';
import { plainToClass } from 'class-transformer';
import {
  DashboardCareRequest,
  DashboardProvider,
  PlainDashboardCareRequest,
  DashboardCurrentState,
} from '../types/dashboard-care-request';
import { DashboardEtaRange } from '../types/dashboard-eta-range';
import { DashboardActiveStatus } from '../types/dashboard-active-status';
import { buildMockDashboardPatient } from './dashboard-patient.mock';
import { Caller } from '../types/caller';
import { format } from 'date-fns';
import { buildMockAppointmentType } from '../../care-request/mocks/service-line.mock';
import { RequestType } from '../../care-request/types/request-type';
import { DashboardCareRequestNote } from '../types/dashboard-care-request-note';

export const buildMockActiveStatus = (
  userDefinedValues?: Partial<DashboardActiveStatus>
): DashboardActiveStatus => {
  return {
    id: faker.datatype.number(),
    name: faker.name.findName(),
    user_id: faker.datatype.number(),
    started_at: faker.datatype.datetime().toISOString(),
    comment: faker.datatype.string(),
    meta_data: {},
    user_name: faker.datatype.string(),
    commentor_name: faker.datatype.string(),
    ...userDefinedValues,
  };
};

export const buildMockEtaRange = (
  userDefinedValues?: Partial<DashboardEtaRange>
): DashboardEtaRange => {
  return {
    id: faker.datatype.number(),
    starts_at: new Date().toISOString(),
    ends_at: new Date().toISOString(),
    care_request_id: faker.datatype.number(),
    care_request_status_id: faker.datatype.number(),
    created_at: faker.datatype.datetime().toISOString(),
    updated_at: faker.datatype.datetime().toISOString(),
    ...userDefinedValues,
  };
};

export const buildMockCaller = (
  userDefinedValues?: Partial<Caller>
): Caller => {
  return {
    id: faker.datatype.number(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    relationship_to_patient: 'patient',
    title: 'title',
    organization_name: 'organization_name',
    origin_phone: '+13035551234',
    dh_phone: '+13035551234',
    skill_name: 'skill_name',
    created_at: faker.datatype.datetime().toISOString(),
    updated_at: faker.datatype.datetime().toISOString(),
    contact_id: 'contact_id',
    ...userDefinedValues,
  };
};

export const buildMockDashboardProvider = (
  userDefinedValues?: Partial<DashboardProvider>
): DashboardProvider => {
  return {
    id: faker.datatype.number().toString(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    provider_image_tiny_url: faker.internet.url(),
    provider_profile_credentials: faker.name.jobTitle(),
    provider_profile_position: 'advanced practice provider',
    ...userDefinedValues,
  };
};

export const buildMockDashboardCurrentState = (
  userDefinedValues?: Partial<DashboardCurrentState>
): DashboardCurrentState => {
  return {
    id: faker.datatype.number(),
    name: faker.datatype.string(),
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status_index: faker.datatype.number(),
    meta_data: { eta: new Date().toISOString() },
    ...userDefinedValues,
  };
};

export const buildMockDashboardCareRequest = (
  userDefinedValues?: Partial<DashboardCareRequest>
): DashboardCareRequest => {
  const careRequest: PlainDashboardCareRequest = {
    id: faker.datatype.number(),
    active_status: buildMockActiveStatus(),
    caller: buildMockCaller(),
    chief_complaint: 'headache',
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    patient_id: 123,
    request_type: RequestType.MOBILE,
    consent_signature: null,
    market_id: faker.datatype.number(),
    signed: true,
    service_line_id: faker.datatype.number(),
    advanced_care_eligibility: true,
    billing_city_id: faker.datatype.number(),
    required_skill_ids: [],
    advanced_care_assessments_complete: true,
    should_be_advanced_care_eligible: true,
    completed_at: faker.date.past().toISOString(),
    featured_note: '',
    street_address_1: faker.address.streetAddress(),
    street_address_2: '',
    city: faker.address.city(),
    state: faker.address.stateAbbr(),
    zipcode: faker.address.zipCode(),
    latitude: Number.parseFloat(faker.address.latitude()),
    longitude: Number.parseFloat(faker.address.longitude()),
    billing_status: 'complete',
    insurance_network_present: true,
    nearby_market_ids: [faker.datatype.number()],
    risk_assessment_score: faker.datatype.number(),
    risk_assessment_worst_case_score: faker.datatype.number(),
    needs_screening: true,
    assignment_date: format(faker.datatype.datetime(), 'yyyy-MM-dd'),
    insurance_package_ids: [],
    questionnaires_unacceptable: true,
    associated_shift_types: [],
    manual_assign_only_skill_ids: [faker.datatype.number()],
    advanced_care_diagnoses: [],
    care_request_statuses: [],
    eta_ranges: [buildMockEtaRange()],
    service_line: {
      id: faker.datatype.number(),
      name: faker.lorem.word(),
      new_patient_appointment_type: buildMockAppointmentType(),
      existing_patient_appointment_type: buildMockAppointmentType(),
      out_of_network_insurance: faker.datatype.boolean(),
      require_checkout: faker.datatype.boolean(),
      require_consent_signature: faker.datatype.boolean(),
      require_medical_necessity: faker.datatype.boolean(),
    },
    current_states: [buildMockDashboardCurrentState()],
    statsig_care_request_id: faker.datatype.uuid(),
    market: {
      id: faker.datatype.number(),
      name: faker.address.city(),
      state: faker.address.state(),
      short_name: faker.address.city(),
      primary_insurance_search_enabled: faker.datatype.boolean(),
      self_pay_rate: faker.datatype.number(),
      only_911: faker.datatype.boolean(),
      auto_assignable: faker.datatype.boolean(),
      tz_name: faker.address.timeZone(),
      tz_short_name: faker.address.timeZone(),
      allow_eta_range_modification: faker.datatype.boolean(),
      auto_assign_type_or_default: faker.lorem.word(),
      next_day_eta_enabled: faker.datatype.boolean(),
    },
    billing_city: undefined,
    patient: buildMockDashboardPatient(false),
    providers: [buildMockDashboardProvider()],
    secondary_screenings: [],
    appointment_slot: {
      id: faker.datatype.number(),
      care_request_id: faker.datatype.number(),
      start_time: faker.datatype.datetime().toISOString(),
      created_at: faker.datatype.datetime().toISOString(),
      updated_at: faker.datatype.datetime().toISOString(),
    },
    ...userDefinedValues,
  };

  return plainToClass(DashboardCareRequest, careRequest);
};

export const buildMockDashboardCareRequestNote = (
  userDefinedValues?: Partial<DashboardCareRequestNote>
): DashboardCareRequestNote => {
  return {
    id: faker.datatype.number(),
    care_request_id: faker.datatype.number(),
    note: faker.datatype.string(),
    note_type: faker.datatype.string(),
    created_at: faker.datatype.datetime(),
    updated_at: faker.datatype.datetime(),
    user_id: faker.datatype.number(),
    meta_data: { companionTasks: [], completeCompanionTasks: [] },
    ...userDefinedValues,
  };
};
