/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProviderDto } from '../../care-request/dto/provider.dto';
import { CurrentStateDto } from '../../care-request/dto/current-state.dto';
import { DashboardPatient, PlainDashboardPatient } from './dashboard-patient';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { CareRequestStateMetadata } from '../../care-request/dto/care-request-state-metadata.dto';
import { Caller } from './caller';
import { parse } from 'date-fns';
import { DashboardActiveStatus } from './dashboard-active-status';
import { DashboardEtaRange } from './dashboard-eta-range';
import {
  CareRequestDto,
  PatientDto,
} from '../../care-request/dto/care-request.dto';
import { RequestType } from '../../care-request/types/request-type';
import { MarketDto } from '../../care-request/dto/market.dto';
import { plainToInstance } from 'class-transformer';
import { logger } from '../../logger';

export interface CareRequestStatus {
  name: string;
  status_index: number;
}

export interface WebhookCareRequestStatus {
  external_id: number;
  comment?: string;
  escalated?: boolean;
  name: string;
  reassignment_reason?: string;
  reassignment_reason_other?: string;
  resolved: boolean;
  started_at: Date;
  station_user_id: number;
}

export interface AppointmentType {
  id: string;
  name: string;
}

export type ProviderPosition =
  | 'advanced practice provider'
  | 'nurse practitioner'
  | 'virtual doctor'
  | 'emt';

export interface DashboardProvider {
  id: string;
  first_name: string;
  last_name: string;
  provider_profile_credentials: string;
  provider_image_tiny_url: string;
  provider_profile_position: ProviderPosition;
}

export interface DashboardCurrentState {
  id: number;
  name: string;
  started_at: string;
  created_at: string;
  updated_at: string;
  status_index: number;
  meta_data?: Record<string, unknown>;
}

export interface DashboardServiceLine {
  id: number;
  name: string;
  new_patient_appointment_type: AppointmentType;
  existing_patient_appointment_type: AppointmentType;
  out_of_network_insurance: boolean;
  require_checkout: boolean;
  require_consent_signature: boolean;
  require_medical_necessity: boolean;
}

export interface CurrentState {
  id: number;
  name: string;
  user_id?: any;
  care_request_id?: number;
  started_at: string;
  created_at: string;
  updated_at: string;
  comment?: any;
  status_index: number;
  commentor_id?: any;
  deleted_at?: any;
  meta_data?: any;
  reassignment_reason?: any;
  reassignment_reason_other?: any;
  user_name?: string;
}

export interface AppointmentSlot {
  id: number;
  care_request_id: number;
  start_time: string;
  created_at: string;
  updated_at: string;
}

export interface Market {
  id: number;
  name: string;
  state: string;
  short_name: string;
  primary_insurance_search_enabled: boolean;
  self_pay_rate: number;
  only_911: boolean;
  auto_assignable: boolean;
  tz_name: string;
  tz_short_name: string;
  allow_eta_range_modification: boolean;
  auto_assign_type_or_default: string;
  next_day_eta_enabled: boolean;
}

export interface BillingCity {
  id: number;
  name: string;
  short_name: string;
  state: string;
  enabled: boolean;
  primary_insurance_search_enabled: boolean;
  tz_name: string;
  tz_short_name: string;
  display_insurance_note: boolean;
  insurance_note: string;
}

export interface PlainDashboardCareRequest {
  accepted_order?: any;
  activated_by?: any;
  active_status: DashboardActiveStatus;
  additional_details?: any;
  advanced_care_assessments_complete: boolean;
  advanced_care_diagnoses: any[];
  advanced_care_eligibility: boolean;
  advanced_care_status?: any;
  appointment_slot?: AppointmentSlot;
  appointment_type_category?: any;
  appointment_type?: any;
  assignment_date?: any;
  assignment_id?: any;
  assignment_status?: any;
  associated_shift_types: any[];
  automated_communication_consent?: any;
  billing_city_id: number;
  billing_city?: BillingCity;
  billing_option?: any;
  billing_status: string;
  bypass_screening_protocol?: any;
  caller: Pick<Caller, 'origin_phone' | 'first_name' | 'last_name'>;
  caller_id?: any;
  care_request_statuses: CareRequestStatus[];
  centura_connect_aco?: any;
  channel_item_id?: any;
  channel_item_selected_with_origin_phone?: any;
  channel_item?: any;
  channel?: any;
  checkout_completed_at?: any;
  chief_complaint: string;
  chrono_visit_id?: any;
  city: string;
  complete_status_started_at?: any;
  completed_at: string;
  confirmed_at?: any;
  consent_signature_url?: any;
  consent_signature: any;
  consenter_name?: any;
  consenter_relationship?: any;
  contact_id?: any;
  created_at: Date;
  credit_card_consent?: any;
  current_states: CurrentState[];
  data_use_consent?: any;
  deleted_at?: any;
  dispatch_queue_id?: any;
  dispatch_queue_name?: any;
  ehr_id?: any;
  ehr_name?: any;
  eta_ranges: DashboardEtaRange[];
  facility?: any;
  featured_note: string;
  id: number;
  insurance_network_present: boolean;
  insurance_package_ids: any[];
  latitude: number;
  longitude: number;
  manual_assign_only_skill_ids: number[];
  market_id: number;
  market: Market;
  marketing_meta_data?: any;
  medical_necessity_satisfied?: boolean;
  mpoa_on_scene?: any;
  nearby_market_ids: number[];
  needs_screening: boolean;
  next_status?: any;
  no_credit_card_reason_other?: any;
  no_credit_card_reason?: any;
  no_referrals_confirmed?: any;
  old_shift_team_id?: any;
  on_accepted_eta?: any;
  on_route_eta?: any;
  on_scene_etc?: any;
  orig_city?: any;
  orig_latitude?: any;
  orig_longitude?: any;
  orig_state?: any;
  orig_street_address_1?: any;
  orig_street_address_2?: any;
  orig_zipcode?: any;
  origin_phone?: any;
  original_complete_status_started_at?: any;
  partner_id?: any;
  partner_referral_id?: any;
  patient_able_to_sign?: any;
  patient_id: number;
  patient_risk?: any;
  patient: PlainDashboardPatient | null;
  phone_number_confirmation_id?: any;
  place_of_service?: any;
  previous_queue_name?: any;
  prioritized_at?: any;
  prioritized_by?: any;
  priority_note?: any;
  privacy_policy_consent?: any;
  prompted_survey_at?: any;
  providers: DashboardProvider[];
  pulled_at?: any;
  pushed_at?: any;
  questionnaires_unacceptable: boolean;
  reason_for_verbal_consent?: any;
  request_status?: any;
  request_type: RequestType;
  requested_by?: any;
  required_skill_ids: string[];
  risk_assessment_score: number;
  risk_assessment_worst_case_score: number;
  secondary_screenings: any[];
  service_line_id: number;
  service_line?: DashboardServiceLine;
  shift_current?: boolean;
  shift_team_id?: any;
  should_be_advanced_care_eligible: boolean;
  signed: boolean;
  state: string;
  statsig_care_request_id: string;
  street_address_1: string;
  street_address_2: string;
  survey_completed_at?: any;
  treatment_consent?: any;
  triage_note_salesforce_id?: any;
  unassignment_reason?: any;
  updated_at: Date;
  use_as_billing_address?: any;
  verbal_consent_at?: any;
  verbal_consent_witness_1_name?: any;
  verbal_consent_witness_2_name?: any;
  was_sent_to_billing?: any;
  zipcode: string;
}

export class DashboardCareRequest implements PlainDashboardCareRequest {
  accepted_order?: any;
  activated_by?: any;
  active_status: DashboardActiveStatus;
  additional_details?: any;
  advanced_care_assessments_complete: boolean;
  advanced_care_diagnoses: any[];
  advanced_care_eligibility: boolean;
  advanced_care_status?: any;
  appointment_slot?: AppointmentSlot;
  appointment_type_category?: any;
  appointment_type?: any;
  assignment_date?: any;
  assignment_id?: any;
  assignment_status?: any;
  associated_shift_types: any[];
  automated_communication_consent?: any;
  billing_city_id: number;
  billing_city: BillingCity;
  billing_option?: any;
  billing_status: string;
  bypass_screening_protocol?: any;
  caller: Pick<Caller, 'origin_phone' | 'first_name' | 'last_name'>;
  caller_id?: any;
  care_request_statuses: CareRequestStatus[];
  centura_connect_aco?: any;
  channel_item_id?: any;
  channel_item_selected_with_origin_phone?: any;
  channel_item?: any;
  channel?: any;
  checkout_completed_at?: any;
  chief_complaint: string;
  chrono_visit_id?: any;
  city: string;
  complete_status_started_at?: any;
  completed_at: string;
  confirmed_at?: any;
  consent_signature_url?: any;
  consent_signature: any;
  consenter_name?: any;
  consenter_relationship?: any;
  contact_id?: any;
  created_at: Date;
  credit_card_consent?: any;
  current_states: CurrentState[];
  data_use_consent?: any;
  deleted_at?: any;
  dispatch_queue_id?: any;
  dispatch_queue_name?: any;
  ehr_id?: any;
  ehr_name?: any;
  eta_ranges: DashboardEtaRange[];
  facility?: any;
  featured_note: string;
  id: number;
  insurance_network_present: boolean;
  insurance_package_ids: any[];
  latitude: number;
  longitude: number;
  manual_assign_only_skill_ids: number[];
  market_id: number;
  market: Market;
  marketing_meta_data?: any;
  medical_necessity_satisfied?: boolean;
  mpoa_on_scene?: any;
  nearby_market_ids: number[];
  needs_screening: boolean;
  next_status?: any;
  no_credit_card_reason_other?: any;
  no_credit_card_reason?: any;
  no_referrals_confirmed?: any;
  old_shift_team_id?: any;
  on_accepted_eta?: any;
  on_route_eta?: any;
  on_scene_etc?: any;
  orig_city?: any;
  orig_latitude?: any;
  orig_longitude?: any;
  orig_state?: any;
  orig_street_address_1?: any;
  orig_street_address_2?: any;
  orig_zipcode?: any;
  origin_phone?: any;
  original_complete_status_started_at?: any;
  partner_id?: any;
  partner_referral_id?: any;
  patient_able_to_sign?: any;
  patient_id: number;
  patient_risk?: any;
  patient: PlainDashboardPatient | null;
  phone_number_confirmation_id?: any;
  place_of_service?: any;
  previous_queue_name?: any;
  prioritized_at?: any;
  prioritized_by?: any;
  priority_note?: any;
  privacy_policy_consent?: any;
  prompted_survey_at?: any;
  providers: DashboardProvider[];
  pulled_at?: any;
  pushed_at?: any;
  questionnaires_unacceptable: boolean;
  reason_for_verbal_consent?: any;
  request_status?: any;
  request_type: RequestType;
  requested_by?: any;
  required_skill_ids: string[];
  risk_assessment_score: number;
  risk_assessment_worst_case_score: number;
  secondary_screenings: any[];
  service_line_id: number;
  service_line: DashboardServiceLine;
  shift_current?: boolean;
  shift_team_id?: any;
  should_be_advanced_care_eligible: boolean;
  signed: boolean;
  state: string;
  statsig_care_request_id: string;
  street_address_1: string;
  street_address_2: string;
  survey_completed_at?: any;
  treatment_consent?: any;
  triage_note_salesforce_id?: any;
  unassignment_reason?: any;
  updated_at: Date;
  use_as_billing_address?: any;
  verbal_consent_at?: any;
  verbal_consent_witness_1_name?: any;
  verbal_consent_witness_2_name?: any;
  was_sent_to_billing?: any;
  zipcode: string;

  private currentStateToStateDto(
    state: DashboardCurrentState
  ): CurrentStateDto {
    return {
      id: state.id,
      name: state.name as CareRequestStatusText,
      startedAt: state.started_at,
      createdAt: state.created_at,
      updatedAt: state.updated_at,
      statusIndex: state.status_index,
      metadata: state.meta_data as unknown as CareRequestStateMetadata,
    };
  }

  private dashboardProviderToProviderDto(
    provider: DashboardProvider
  ): ProviderDto {
    return {
      id: provider.id,
      firstName: provider.first_name,
      lastName: provider.last_name,
      providerProfileCredentials: provider.provider_profile_credentials,
      providerImageTinyUrl: provider.provider_image_tiny_url,
      providerProfilePosition: provider.provider_profile_position,
    };
  }

  private dashboardMarketToMarketDto(market: Market): MarketDto {
    return {
      id: market.id,
      name: market.name,
      state: market.state,
      shortName: market.short_name,
      tzName: market.tz_name,
      tzShortName: market.tz_short_name,
    };
  }

  toCareRequestDto(): CareRequestDto {
    let patientDto: PatientDto | null;
    if (this.patient) {
      patientDto =
        plainToInstance(DashboardPatient, this.patient)?.toPatientDto() ?? null;
    } else {
      patientDto = null;
      logger.error('Received care request with null/undefined patient', {
        careRequest: {
          id: this.id,
          updatedAt: this.updated_at,
        },
      });
    }

    return {
      id: this.id,
      statsigCareRequestId: this.statsig_care_request_id,
      activeStatus: {
        id: this.active_status.id,
        name: this.active_status.name,
        userId: this.active_status.user_id,
        startedAt: this.active_status.started_at,
        comment: this.active_status.comment,
        metadata: this.active_status.meta_data,
        username: this.active_status.user_name,
        commenterName: this.active_status.commentor_name,
      },
      assignmentDate: this.assignment_date
        ? parse(this.assignment_date, 'yyyy-MM-dd', new Date()).toISOString()
        : undefined,
      caller: this.caller,
      requestType: this.request_type,
      patient: patientDto,
      streetAddress1: this.street_address_1,
      streetAddress2: this.street_address_2,
      zipcode: this.zipcode,
      state: this.state,
      city: this.city,
      phoneNumber: patientDto?.mobileNumber || null,
      latitude: this.latitude,
      longitude: this.longitude,
      etaRanges: this.eta_ranges.map((eta) => ({
        id: eta.id,
        startsAt: eta.starts_at,
        endsAt: eta.ends_at,
        careRequestId: eta.care_request_id,
        careRequestStatusId: eta.care_request_status_id,
        createdAt: eta.created_at,
        updatedAt: eta.updated_at,
      })),
      providers: Array.isArray(this.providers)
        ? this.providers
            .map((provider) => this.dashboardProviderToProviderDto(provider))
            .filter(
              (provider) =>
                provider.providerProfilePosition !== 'virtual doctor'
            )
        : [],
      chiefComplaint: this.chief_complaint,
      patientId: this.patient_id,
      createdAt: this.created_at,
      appointmentSlot: this.appointment_slot
        ? {
            id: this.appointment_slot.id,
            careRequestId: this.appointment_slot.care_request_id,
            startTime: this.appointment_slot.start_time,
            createdAt: this.appointment_slot.created_at,
            updatedAt: this.appointment_slot.updated_at,
          }
        : undefined,
      currentState: Array.isArray(this.current_states)
        ? this.current_states.map((state) => this.currentStateToStateDto(state))
        : [],
      serviceLine: this.service_line
        ? {
            id: this.service_line.id,
            name: this.service_line.name,
            newPatientAppointmentType:
              this.service_line.new_patient_appointment_type,
            existingPatientAppointmentType:
              this.service_line.existing_patient_appointment_type,
            outOfNetworkInsurance: this.service_line.out_of_network_insurance,
            requireCheckout: this.service_line.require_checkout,
            requireConsentSignature:
              this.service_line.require_consent_signature,
            requireMedicalNecessity:
              this.service_line.require_medical_necessity,
          }
        : undefined,
      market: this.dashboardMarketToMarketDto(this.market),
    };
  }
}

export class DashboardWebhookCareRequest {
  external_id: number;
  assignment_date: Date;
  care_request_statuses: WebhookCareRequestStatus[];
  eta?: Date;
  eta_ranges: DashboardEtaRange[];
  order_id?: number;
  partner_id?: number;
  request_status: string;
}
