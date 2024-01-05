export type PatientData = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  //TODO: PT-1767 - review legal sex type and make it required
  legalSex?: string;
  phoneNumber: string;
  assignedSexAtBirth: string;
  genderIdentity?: string;
};
