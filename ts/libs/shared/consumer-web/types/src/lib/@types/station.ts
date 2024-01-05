import { Requester } from './requester';
import { Address } from './address';
import { Patient, StationPatient } from './patient';
import { ChannelItem, StationChannelItem } from './channel-items';
import { StationStatus, Status } from './care-request-status';
import { ServiceLine } from './service-line';
import {
  SecondaryScreening,
  StationSecondaryScreening,
} from './secondary-screening';
import { EtaRange, StationEtaRange } from './assign-team';
import { ShiftTeam, StationShiftTeam } from './shift-team';
import { Market, StationMarket } from './market';
import { PartnerReferral } from './partner-referral';
import {
  AppointmentSlot,
  CareRequestType,
  PatientPreferredEta,
  RequestedServiceLine,
  RequestStatus,
  StationAppointmentSlot,
  StationAppointmentSlotAttributes,
} from './care-request';
import { RiskQuestion, StationRiskQuestion } from './risk-question';
import { AppointmentType } from './insurance-plan';

export interface OssCareRequest {
  careRequest: {
    id?: number;
    marketId: number;
    requesterId?: number;
    requestType?: CareRequestType;
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
    placeOfService?: string;
    requester?: Partial<Requester>;
    address: Partial<Address>;
    patient?: Partial<Patient>;
    channelItem?: Partial<ChannelItem>;
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
  };
  riskAssessment?: {
    id?: number;
    userId?: number;
    type?: string;
    protocolTags?: string[];
    protocolScore?: number;
    overriddenAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dob: string;
    gender: string;
    worstCaseScore: number;
    score: number;
    protocolId: number;
    protocolName: string;
    overrideReason: string;
    complaint: {
      symptom: string;
      selectedSymptoms: string;
    };
    responses: {
      questions: RiskQuestion[];
    };
  };
  mpoaConsent: {
    consented: boolean;
    powerOfAttorneyId: number;
    timeOfConsentChange: Date | string;
    id?: number;
    userId?: number;
  };
}

export interface OssStationCareRequest {
  care_request: {
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
    latitude?: string | number;
    longitude?: string | number;
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
  };
  risk_assessment?: {
    id?: number;
    user_id?: number;
    care_request_id?: number;
    type?: string;
    protocol_tags?: string[];
    protocol_score?: number;
    overridden_at?: Date | string;
    created_at?: Date | string;
    updated_at?: Date | string;
    dob: string;
    gender: string;
    worst_case_score: number;
    score: number;
    protocol_id: number;
    protocol_name: string;
    override_reason: string;
    responses: {
      questions: StationRiskQuestion[];
    };
    chief_complaint: string;
    selected_symptoms: string;
  };
  mpoa_consent: {
    id?: number;
    consented: boolean;
    power_of_attorney_id: number;
    time_of_consent_change: Date | string;
    care_request_id?: number;
    user_id?: number;
    created_at?: Date;
    updated_at?: Date;
  };
}
