import {
  SecondaryScreening,
  StationSecondaryScreening,
} from './secondary-screening';
import { Address } from './address';
import { Patient, StationPatient } from './patient';
import { Requester } from './requester';
import { ServiceLine } from './service-line';
import { AppointmentType } from './insurance-plan';
import { EtaRange, StationEtaRange } from './assign-team';
import { ShiftTeam, StationShiftTeam } from './shift-team';
import { StationStatus, Status } from './care-request-status';
import { Market, StationMarket } from './market';
import { ChannelItem, StationChannelItem } from './channel-items';
import { PartnerReferral } from './partner-referral';

export enum CareRequestType {
  web = 'web',
  phone = 'phone',
  manual_911 = 'manual_911',
  api = 'api',
  centura_care_coordinator = 'centura_care_coordinator',
  centura_connect = 'centura_connect',
  express = 'express',
  external_ehr = 'external_ehr',
  mobile = 'mobile',
  mobile_android = 'mobile_android',
  orderly = 'orderly',
  redox = 'redox',
  oss = 'web_self_schedule',
}

export enum RequestStatus {
  unassigned = 'unassigned',
  scheduled = 'scheduled',
  requested = 'requested',
  failedAssignment = 'failed_assignment',
  accepted = 'accepted',
  onRoute = 'on_route',
  onScene = 'on_scene',
  virtualAppAssigned = 'virtual_app_assigned',
  virtualAppUnassigned = 'virtual_app_unassigned',
  complete = 'complete',
  billing = 'billing',
  followup2 = 'followup_2',
  followup14 = 'followup_14',
  followup30 = 'followup_30',
  archived = 'archived',
  rescheduleToday = 'reschedule_today',
  rescheduleTomorrow = 'reschedule_tomorrow',
}

export enum RequestedServiceLine {
  acuteCare = 'acute_care',
  bridgeCare = 'bridge_care',
  advancedCare = 'advanced_care',
  edToHome = 'ed_to_home',
  edEducation = 'ed_education',
  wellnessVisits = 'wellness_visits',
  dhFollowUp = 'dh_follow_up',
}

export interface ConsentSignature {
  url?: string;
  thumb?: { url?: string };
  tiny?: { url?: string };
}

export interface PatientPreferredEta {
  patientPreferredEtaStart?: Date | string;
  patientPreferredEtaEnd?: Date | string;
}

export interface CareRequest {
  id: number;
  marketId: number;
  requesterId?: number;
  requestType: CareRequestType;
  requestStatus?: RequestStatus;
  patientId?: number;
  serviceLineId?: number;
  channelItemId?: number;
  billingCityId?: number;
  bypassRiskStratificationData?: {
    accreditedRiskStratification: boolean;
    chiefComplaint?: string;
    symptoms?: string;
    patientNotes: string;
  };
  statsigCareRequestId?: string;
  billingOption?: string;
  billingStatus?: string;
  placeOfService: string;
  requester?: Partial<Requester>;
  address: Partial<Address>;
  patient: Partial<Patient>;
  channelItem: Partial<ChannelItem>;
  activeStatus?: Status;
  appointmentSlot?: AppointmentSlot;
  serviceLine?: Pick<
    ServiceLine,
    | 'id'
    | 'name'
    | 'outOfNetworkInsurance'
    | 'existingPatientAppointmentType'
    | 'newPatientAppointmentType'
  >;
  riskAssessment?: {
    protocolName: string;
  };
  riskAssessmentScore?: number;
  riskAssessmentWorstCaseScore?: number;
  secondaryScreenings?: SecondaryScreening[];
  complaint: {
    symptoms: string;
  };
  etaRanges?: EtaRange[];
  bypassSreeningProtocol?: boolean;
  channelItemSelectedWithOriginPhone?: string;
  shiftTeam?: ShiftTeam;
  shiftTeamId?: number;
  assignmentDate?: string;
  assignmentStatus?: string;
  market?: Market;
  requestedServiceLine?: RequestedServiceLine;
  patientPreferredEta?: PatientPreferredEta;
  partnerReferral?: PartnerReferral;
  priorityNote?: string;
}

export interface AppointmentSlot {
  id?: number;
  destroy?: number | boolean;
  careRequestId?: number;
  startTime?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StationCareRequestUnauthorized {
  care_request: {
    request_type: string;
    street_address_1: string;
    street_address_2: string;
    city: string;
    state: string;
    zipcode: string | number;
    chief_complaint: string;
    patient_attributes: {
      first_name: string;
      last_name: string;
      mobile_number: string;
      patient_email: string;
      dob: string;
      gender: string;
    };
    caller_attributes: {
      relationship_to_patient: string;
      first_name: string;
      last_name: string;
      origin_phone: string;
      organization_name?: string;
    };
    marketing_meta_data?: {
      source: string;
    };
    patient_preferred_eta_start?: Date | string;
    patient_preferred_eta_end?: Date | string;
    statsig_stable_id?: string;
  };
  'g-recaptcha-response-data': {
    request_care: string;
  };
}

export interface StationCareRequestUnauthorizedNotification {
  job_id: string | number;
  'g-recaptcha-response-data'?: {
    request_care: string;
  };
}

export interface StationAppointmentSlot {
  id?: number;
  care_request_id?: number;
  start_time?: string | Date;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface StationAppointmentSlotAttributes {
  id?: number;
  start_time?: string | Date;
  _destroy?: number | boolean;
}

export interface StationCareRequest {
  id?: number;
  skip_geocode?: boolean;
  request_status?: RequestStatus;
  request_type: CareRequestType;
  caller_id: number;
  market_id: number;
  billing_city_id?: number;
  statsig_care_request_id?: string;
  billing_option?: string;
  billing_status?: string;
  bypass_risk_stratification_data?: {
    accredited_risk_stratification: boolean;
    chief_complaint?: string;
    symptoms?: string;
    patient_notes: string;
  };
  patient_id?: number;
  street_address_1: string;
  street_address_2: string;
  additional_details?: string;
  city: string;
  state: string;
  zipcode: string | number;
  latitude: string | number;
  longitude: string | number;
  chief_complaint: string;
  service_line_id: number;
  channel_item_id: number;
  channel_item?: StationChannelItem;
  bypass_screening_protocol?: boolean;
  channel_item_selected_with_origin_phone?: string;
  changed?: boolean;
  place_of_service: string;
  active_status?: StationStatus;
  appointment_slot?: StationAppointmentSlot;
  appointment_slot_attributes?: StationAppointmentSlotAttributes;
  patient_attributes?: StationPatient;
  patient_preferred_eta_start?: Date | string;
  patient_preferred_eta_end?: Date | string;
  caller_attributes?: {
    id?: number;
    relationship_to_patient: string;
    first_name: string;
    last_name: string;
    origin_phone: string;
    dh_phone: string;
    contact_id: string;
    organization_name?: string;
  };
  patient?: StationPatient;
  caller?: {
    id?: number;
    relationship_to_patient: string;
    first_name: string;
    last_name: string;
    origin_phone: string;
    dh_phone: string;
    contact_id: string;
    organization_name?: string;
  };
  service_line?: {
    id: number;
    name: string;
    existing_patient_appointment_type: AppointmentType;
    new_patient_appointment_type: AppointmentType;
    out_of_network_insurance: boolean;
    require_checkout: boolean;
    require_consent_signature: boolean;
    require_medical_necessity: boolean;
  };
  marketing_meta_data?: { source: string };
  'g-recaptcha-response-data'?: {
    request_care: string;
  };
  secondary_screenings?: StationSecondaryScreening[];
  risk_assessment?: {
    protocol_name: string;
  };
  risk_assessment_score?: number;
  risk_assessment_worst_case_score?: number;
  eta_ranges?: StationEtaRange[];
  shift_team?: StationShiftTeam;
  shift_team_id?: number;
  assignment_date?: string;
  assignment_status?: string;
  market?: StationMarket;
  requested_service_line?: RequestedServiceLine;
  partner_referral_id?: number;
  partner_referral_name?: string;
  partner_referral_phone?: string;
  partner_referral_relationship?: string;
  priority_note?: string;
}

export interface StationLastCareRequest extends Partial<StationCareRequest> {
  created_at?: Date | string;
  updated_at?: Date | string;
  orig_street_address_1?: string;
  orig_street_address_2?: string;
  orig_zipcode?: string;
  deleted_at?: string;
  requested_by?: string;
  orig_city?: string;
  orig_state?: string;
  prompted_survey_at?: string;
  chrono_visit_id?: string;
  facility?: string;
  old_shift_team_id?: string;
  orig_latitude?: string;
  orig_longitude?: string;
  data_use_consent?: string;
  treatment_consent?: string;
  privacy_policy_consent?: string;
  consent_signature?: ConsentSignature;
  pulled_at?: string;
  pushed_at?: string;
  use_as_billing_address?: string;
  triage_note_salesforce_id?: string;
  centura_connect_aco?: string;
  accepted_order?: string;
  ehr_name?: string;
  ehr_id?: string;
  appointment_type?: string;
  activated_by?: string;
  credit_card_consent?: string;
  dispatch_queue_id?: number;
  prioritized_at?: string;
  prioritized_by?: string;
  consenter_relationship?: string;
  consenter_name?: string;
  verbal_consent_at?: string;
  on_route_eta?: string;
  on_scene_etc?: string;
  on_accepted_eta?: string;
  checkout_completed_at?: string;
  origin_phone?: string;
  no_referrals_confirmed?: string;
  signed?: boolean;
  contact_id?: string;
  no_credit_card_reason?: string;
  no_credit_card_reason_other?: string;
  complete_status_started_at?: string;
  phone_number_confirmation_id?: string;
  appointment_type_category?: string;
  advanced_care_eligibility?: boolean;
  original_complete_status_started_at?: string;
  partner_id?: string;
  automated_communication_consent?: string;
  required_skill_ids?: string[] | number[];
  patient_risk?: string;
  advanced_care_status?: string;
  confirmed_at?: string;
  assignment_id?: string;
  patient_able_to_sign?: string;
  mpoa_on_scene?: string;
  reason_for_verbal_consent?: string;
  verbal_consent_witness_1_name?: string;
  verbal_consent_witness_2_name?: string;
  unassignment_reason?: string;
  consenter_phone_number?: string;
  order_id?: string;
  consenter_relationship_details?: string;
  consenter_on_scene?: string;
  unsynched_changes?: object;
}

export interface LastCareRequest extends Partial<CareRequest> {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  chiefComplaint?: string;
  latitude?: string | number;
  longitude?: string | number;
  origStreetAddress1?: string;
  origStreetAddress2?: string;
  origZipcode?: string;
  deletedAt?: string;
  requestedBy?: string;
  origCity?: string;
  origState?: string;
  promptedSurveyAt?: string;
  chronoVisitId?: string;
  facility?: string;
  oldShiftTeamId?: string;
  origLatitude?: string;
  origLongitude?: string;
  dataUseConsent?: string;
  treatmentConsent?: string;
  privacyPolicyConsent?: string;
  consentSignature?: ConsentSignature;
  pulledAt?: string;
  pushedAt?: string;
  useAsBillingAddress?: string;
  triageNoteSalesforceId?: string;
  centuraConnectAco?: string;
  acceptedOrder?: string;
  ehrName?: string;
  ehrId?: string;
  appointmentType?: string;
  activatedBy?: string;
  creditCardConsent?: string;
  dispatchQueueId?: number;
  prioritizedAt?: string;
  prioritizedBy?: string;
  consenterRelationship?: string;
  consenterName?: string;
  verbalConsentAt?: string;
  onRouteEta?: string;
  onSceneEtc?: string;
  onAcceptedEta?: string;
  checkoutCompletedAt?: string;
  originPhone?: string;
  marketingMetaData?: {
    source: string;
  };
  noReferralsConfirmed?: string;
  signed?: boolean;
  contactId?: string;
  noCreditCardReason?: string;
  noCreditCardReasonOther?: string;
  bypassScreeningProtocol?: boolean;
  completeStatusStartedAt?: string;
  callerId?: number;
  phoneNumberConfirmationId?: string;
  appointmentTypeCategory?: string;
  advancedCareEligibility?: boolean;
  originalCompleteStatusStartedAt?: string;
  partnerId?: string;
  automatedCommunicationConsent?: string;
  requiredSkillIds?: string[] | number[];
  patientRisk?: string;
  advancedCareStatus?: string;
  confirmedAt?: string;
  assignmentId?: string;
  patientAbleToSign?: string;
  mpoaOnScene?: string;
  reasonForVerbalConsent?: string;
  verbalConsentWitness1Name?: string;
  verbalConsentWitness2Name?: string;
  unassignmentReason?: string;
  consenterPhoneNumber?: string;
  orderId?: string;
  consenterRelationshipDetails?: string;
  consenterOnScene?: string;
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  zipcode?: string | number;
  unsynchedChanges?: object;
}
