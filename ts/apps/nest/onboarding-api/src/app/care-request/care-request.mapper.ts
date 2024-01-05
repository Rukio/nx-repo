import {
  StationCareRequest,
  CareRequest,
  StationPartnerReferral,
  PartnerReferral,
} from '@*company-data-covered*/consumer-web-types';
import InputNotSpecifiedException from '../common/exceptions/input-not-specified.exception';

const CareRequestToStationCareRequestPatch = (
  input: Partial<CareRequest>
): Partial<StationCareRequest> => {
  if (!input) {
    throw new InputNotSpecifiedException(
      CareRequestToStationCareRequestPatch.name
    );
  }
  const output: Partial<StationCareRequest> = {
    market_id: input.marketId,
    request_type: input.requestType,
    caller_id: input.requesterId,
    patient_id: input.patientId,
    service_line_id: input.serviceLineId,
    channel_item_id: input.channelItemId,
    billing_city_id: input.billingCityId,
    place_of_service: input.placeOfService,
    street_address_1: input.address?.streetAddress1,
    street_address_2: input.address?.streetAddress2,
    additional_details: input.address?.additionalDetails,
    city: input.address?.city,
    state: input.address?.state,
    zipcode: input.address?.zip,
    latitude: input.address?.latitude,
    longitude: input.address?.longitude,
    chief_complaint: input.complaint?.symptoms,
    patient_attributes: input.patient && {
      id: input.patient.id,
      first_name: input.patient.firstName,
      last_name: input.patient.lastName,
      mobile_number: input.patient.phone,
      patient_email: input.patient.email,
      dob: input.patient.dateOfBirth,
      gender: input.patient.gender,
      class_name: input.patient.className,
      eligibility_file_id: input.patient.eligibilityFileId,
      eligible_patient_id: input.patient.eligiblePatientId,
      patient_id: input.patient.patientId,
    },
    caller_attributes: input.requester && {
      id: input.requester.id,
      relationship_to_patient: input.requester.relationToPatient,
      first_name: input.requester.firstName,
      last_name: input.requester.lastName,
      origin_phone: input.requester.phone,
      dh_phone: input.requester.dhPhone,
      contact_id: input.requester.conversationId,
      organization_name: input.requester.organizationName,
    },
    appointment_slot_attributes: input.appointmentSlot && {
      id: input.appointmentSlot.id,
      start_time: input.appointmentSlot.startTime,
      _destroy: input.appointmentSlot.destroy,
    },
    assignment_date: input.assignmentDate,
    requested_service_line: input.requestedServiceLine,
  };

  return output;
};

const StationPartnerReferraltoPartnerReferral = (
  input: StationPartnerReferral
): PartnerReferral => {
  const output: PartnerReferral = {
    id: input.id,
    firstName: input.contact_name?.split(/ (.*)/, 2)[0],
    lastName: input.contact_name?.split(/ (.*)/, 2)[1],
    phone: input.contact_phone,
    relationship: input.contact_relationship_to_patient,
  };

  return output;
};

export default {
  CareRequestToStationCareRequestPatch,
  StationPartnerReferraltoPartnerReferral,
};
