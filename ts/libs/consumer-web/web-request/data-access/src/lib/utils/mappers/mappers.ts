import {
  CreateUnauthenticatedCareRequestDataPayload,
  UnauthenticatedCareRequestResult,
  Market as DomainMarketDetails,
  ZipCodeDetails as DomainZipCodeDetails,
} from '@*company-data-covered*/station/data-access';
import {
  CareRequestResult,
  CreateCareRequestPayload,
  MarketDetails,
  ZipCodeDetails,
} from '../../feature';

export const toCreateCareRequestPayload = (
  data: CreateCareRequestPayload
): CreateUnauthenticatedCareRequestDataPayload => ({
  care_request: {
    request_type: data.type,
    street_address_1: data.address.streetAddress1,
    street_address_2: data.address.streetAddress2,
    city: data.address.city,
    state: data.address.state,
    zipcode: data.address.postalCode,
    chief_complaint: data.complaint.symptoms,
    patient_attributes: {
      first_name: data.patient.firstName,
      last_name: data.patient.lastName,
      mobile_number: data.patient.phone,
      patient_email: data.patient.email,
      dob: data.patient.birthday,
      gender: data.patient.sex,
    },
    caller_attributes: {
      relationship_to_patient: data.caller.relationshipToPatient,
      first_name: data.caller.firstName,
      last_name: data.caller.lastName,
      origin_phone: data.caller.phone,
    },
    marketing_meta_data: data.marketingMetaData,
    patient_preferred_eta_start:
      data.patientPreferredEta?.patientPreferredEtaStart,
    patient_preferred_eta_end: data.patientPreferredEta?.patientPreferredEtaEnd,
    statsig_stable_id: data.statsigStableId,
  },
  'g-recaptcha-response-data': {
    request_care: data.token,
  },
});

export const toCareRequestResult = (
  data: UnauthenticatedCareRequestResult
): CareRequestResult => ({
  success: data.success,
  statsigCareRequestId: data.care_request_id,
});

export const toZipCodeDetails = (
  input?: DomainZipCodeDetails
): ZipCodeDetails | null => {
  if (!input) {
    return null;
  }

  return {
    id: input.id,
    billingCityId: input.billing_city_id,
    marketId: input.market_id,
  };
};

export const toMarketDetails = (
  input?: DomainMarketDetails
): MarketDetails | null => {
  if (!input) {
    return null;
  }

  return {
    id: input.id,
    name: input.name,
    marketName: input.market_name,
    timezone: input.timezone,
    contactEmail: input.contact_email,
    state: input.state,
    shortName: input.short_name,
    enabled: input.enabled,
    only911: input.only_911,
    primaryInsuranceSearchEnabled: input.primary_insurance_search_enabled,
    tzName: input.tz_name,
    tzShortName: input.tz_short_name,
    stateLocale: input.state_locale && {
      id: input.state_locale.id,
      name: input.state_locale.name,
      abbreviation: input.state_locale.abbreviation,
      screenerLine: input.state_locale.screener_line && {
        id: input.state_locale.screener_line.id,
        genesysId: input.state_locale.screener_line.genesys_id,
        phoneNumber: input.state_locale.screener_line.phone_number,
        queueName: input.state_locale.screener_line.queue_name,
      },
    },
    genesysId: input.genesys_id,
    allowEtaRangeModification: input.allow_eta_range_modification,
    autoAssignTypeOrDefault: input.auto_assign_type_or_default,
    autoAssignable: input.auto_assignable,
    nextDayEtaEnabled: input.next_day_eta_enabled,
    selfPayRate: input.self_pay_rate,
    schedules: input?.schedules?.map((schedule) => ({
      id: schedule.id,
      openAt: schedule.open_at,
      closeAt: schedule.close_at,
      openDuration: schedule.open_duration,
      days: schedule.days,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
      schedulableType: schedule.schedulable_type,
      schedulableId: schedule.schedulable_id,
    })),
  };
};
