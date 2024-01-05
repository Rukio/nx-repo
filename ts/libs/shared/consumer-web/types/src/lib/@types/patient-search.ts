export interface StationPatientSearchParam {
  first_name: string;
  last_name: string;
}

export interface PatientSearchParam {
  firstName: string;
  lastName: string;
  zipCode?: string;
  dateOfBirth?: string;
  limit: number;
  offset: number;
}
