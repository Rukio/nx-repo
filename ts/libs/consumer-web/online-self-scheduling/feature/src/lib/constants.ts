/**
 * The value of the request progress indicator.
 * Value between 0 and 100.
 */
export enum RequestProgressStep {
  WhoNeedsCare = 5,
  Symptoms = 10,
  PreferredTime = 15,
  PatientDemographics = 25,
  Consent = 35,
  Address = 50,
  Insurance = 70,
  ConfirmDetails = 90,
}

export const ONLINE_SELF_SCHEDULING_ROUTES = {
  HOME: '/',
  SYMPTOMS: '/symptoms',
  PREFERRED_TIME: '/preferred-time',
  PATIENT_DEMOGRAPHICS: '/patient-demographics',
  CONSENT: '/consent',
  ADDRESS: '/address',
  INSURANCE: '/insurance',
  CONFIRM_DETAILS: '/confirm-details',
  CALL_SCREENER: '/call-screener',
  CONFIRMATION: '/confirmation',
  BOOKED_TIME: '/booked-time',
  OFFBOARD: '/offboard',
};

export const SEGMENT_EVENTS = {
  PAGE_VIEW_REQUEST_CARE_FOR: 'oss_requesting_care_for_page_view',
  SUBMIT_REQUEST_CARE_FOR_SELECT: 'oss_requesting_care_for_dropdown_selection',
  PAGE_VIEW_SYMPTOM: 'oss_symptoms_page_view',
  SUBMIT_SYMPTOM_DROPDOWN_SELECT: 'oss_symptoms_symptom_dropdown_selection',
  SUBMIT_SYMPTOM_INPUT_TEXT: 'oss_symptoms_symptom_input_text',
  MEDICAL_ATTESTATION_CHECK: 'oss_symptoms_medical_attestation_selection',
  PAGE_VIEW_PREFERRED_TIME: 'oss_time_window_page_view',
  PAGE_VIEW_CONSENT: 'oss_consent_page_view',
  CONSENT_MAKER_SELECTION: 'oss_consent_page_medical_decision_maker_selection',
  CONSENT_ON_SCENE_SELECTION:
    'oss_consent_page_medical_decision_on_scene_selection',
  PAGE_VIEW_PATIENT_DEMOGRAPHICS: 'oss_demographics_page_view',
  PAGE_VIEW_SCREENING: 'oss_screening_page_view',
  SCREENING_CLICK_CALL: 'oss_screening_page_click_to_call',
  PAGE_VIEW_LOCATION: 'oss_location_page_view',
  LOCATION_ZIP_CODE: 'oss_location_input_zip_code',
  PAGE_VIEW_INSURANCE: 'oss_insurance_page_view',
  INSURANCE_OON_MESSAGE_VISIBLE: 'oss_insurance_out_of_network_message_view',
  PAGE_VIEW_BOOKED_TIME: 'oss_time_window_booked_page_view',
  PAGE_VIEW_CONFIRM_DETAILS: 'oss_confirm_details_page_view',
  PAGE_VIEW_OFFBOARD: 'oss_offboard_page_view',
  PAGE_VIEW_SCHEDULE: 'oss_scheduled_page_view',
  CONFIRM_CARE_REQUEST_CREATED: 'oss_confirm_cr_created',
};
