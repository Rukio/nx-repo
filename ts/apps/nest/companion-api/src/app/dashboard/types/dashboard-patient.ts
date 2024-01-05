/* eslint-disable @typescript-eslint/no-explicit-any */
import { PatientDto } from '../../care-request/dto/care-request.dto';
import { Gender } from '../../care-request/enums/care-request-patient-gender.enum';

/** Represents the patient interface received from the Dashboard APIs. */
export interface PlainDashboardPatient {
  id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  created_at: Date;
  updated_at: Date;
  user_id: number;
  chrono_patient_id?: any;
  is_user: boolean;
  patient_email?: any;
  dob?: string;
  gender: Gender;
  pcp_name?: any;
  pcp_phone?: any;
  account_id: number;
  avatar: any;
  pulled_at?: any;
  pushed_at?: any;
  ssn?: any;
  patient_salesforce_id?: any;
  deleted_at?: any;
  ehr_name?: any;
  ehr_id?: any;
  pcp_practice_name?: any;
  middle_name?: any;
  voicemail_consent?: any;
  partner_id?: any;
  portal_access?: any;
  suffix?: any;
  channel_item_id?: any;
  source_type: string;
  last_care_request?: any;
  care_history?: any;
  has_been_billed?: boolean;
  unsynched_changes: any;
  billing_address_street_address_1?: any;
  billing_address_street_address_2?: any;
  billing_address_city?: any;
  billing_address_state?: any;
  billing_address_zipcode?: any;
  new_patient?: boolean;
  age: number;
  phone_number: any;
}

/** The functional class the represents a patient model from Dashboard. */
export class DashboardPatient implements PlainDashboardPatient {
  id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  created_at: Date;
  updated_at: Date;
  user_id: number;
  chrono_patient_id?: any;
  is_user: boolean;
  patient_email?: any;
  dob?: string;
  gender: Gender;
  pcp_name?: any;
  pcp_phone?: any;
  account_id: number;
  avatar: any;
  pulled_at?: any;
  pushed_at?: any;
  ssn?: any;
  patient_salesforce_id?: any;
  deleted_at?: any;
  ehr_name?: any;
  ehr_id?: any;
  pcp_practice_name?: any;
  middle_name?: any;
  voicemail_consent?: any;
  partner_id?: any;
  portal_access?: any;
  suffix?: any;
  channel_item_id?: any;
  source_type: string;
  last_care_request?: any;
  care_history?: any;
  has_been_billed?: boolean;
  unsynched_changes: any;
  billing_address_street_address_1?: any;
  billing_address_street_address_2?: any;
  billing_address_city?: any;
  billing_address_state?: any;
  billing_address_zipcode?: any;
  new_patient?: boolean;
  age: number;
  phone_number: any;
  preferred_pharmacy?: any;

  private formatDob = (dob: string | undefined) => {
    if (!dob) {
      return undefined;
    }

    // yyyy-MM-dd => MM/dd/yyyy
    const dobArray = dob.split('-');

    return `${dobArray[1]}/${dobArray[2]}/${dobArray[0]}`;
  };

  toPatientDto(): PatientDto {
    return {
      id: this.id,
      firstName: this.first_name,
      lastName: this.last_name,
      mobileNumber: this.mobile_number,
      email: this.patient_email,
      voicemailConsent: this.voicemail_consent,
      dob: this.formatDob(this.dob),
      gender: this.gender,
      ehrId: this.ehr_id,
    };
  }
}
