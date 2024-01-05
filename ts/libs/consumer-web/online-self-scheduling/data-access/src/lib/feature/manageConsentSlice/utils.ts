import {
  DomainPatient,
  DomainUnverifiedPatient,
  PatientAccount,
} from '../../types';

export const getPatientForPOA = (
  isRequesterRelationshipSelf: boolean,
  unverifiedPatient: DomainUnverifiedPatient | null,
  patientAccount: PatientAccount,
  patient?: DomainPatient
): PatientAccount | DomainPatient | DomainUnverifiedPatient => {
  if (isRequesterRelationshipSelf) {
    return patient?.id ? patient : unverifiedPatient ?? patientAccount;
  }

  return patientAccount;
};
