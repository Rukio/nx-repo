import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export enum RelationToPatient {
  FamilyFriend = 'family:friend',
  Clinician = 'clinician',
  Other = 'other',
  Patient = 'patient',
}

export type OnlineSelfSchedulingError = FetchBaseQueryError | SerializedError;

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export enum GenderIdentity {
  Male = 'm',
  Female = 'f',
  FemaleToMale = 'ftm',
  MaleToFemale = 'mtf',
  NonBinary = 'nb',
  Other = 'other',
  Unknown = 'u',
}

export enum AssignedSexAtBirth {
  Male = 'm',
  Female = 'f',
  ChooseNotToDisclose = 'cntd',
  Unknown = 'u',
}

export enum FacilityTypeName {
  Home = 'Home',
  IndependentLivingFacility = 'Independent Living Facility',
  SeniorLivingTesting = 'Senior Living Testing',
  AssistedLivingFacility = 'Assisted Living Facility',
  Clinic = 'Clinic',
  LongTermCareFacility = 'Long-term Care Facility',
  RehabilitationFacility = 'Rehabilitation Facility',
  School = 'School',
  SkilledNursingFacility = 'Skilled Nursing Facility',
  VirtualVisit = 'Virtual Visit',
  Work = 'Work',
  Hotel = 'Hotel',
}

export enum InsuranceEligibilityStatus {
  Eligible = 'eligible',
  Ineligible = 'ineligible',
  Unverified = 'unverified',
}

export enum InsurancePriority {
  PRIMARY = '1',
  SECONDARY = '2',
}

export enum OffboardReason {
  AcuitySegmentation = 'Acuity segmentation',
  FullyBooked = 'Fully booked',
  DismissedPatient = 'Dismissed patient',
}
