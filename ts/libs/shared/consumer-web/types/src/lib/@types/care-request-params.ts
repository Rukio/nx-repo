import { PatientPreferredEta } from './care-request';

export interface CareRequestParams {
  type: string;
  token: string;
  patient: {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthday: string;
    sex: string;
  };
  caller: {
    id?: number;
    relationshipToPatient: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
  };
  complaint: {
    symptoms: string;
  };
  address: {
    streetAddress1: string;
    streetAddress2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  marketingMetaData?:
    | {
        source: string;
      }
    | undefined;
  patientPreferredEta?: PatientPreferredEta;
  statsigStableId?: string;
}

export interface CareRequestNotificationParams {
  jobId: string | number;
  token: string;
}
