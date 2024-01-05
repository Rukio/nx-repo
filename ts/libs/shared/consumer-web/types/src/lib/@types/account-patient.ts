import { Patient, UnverifiedPatient } from './patient';

export enum AccessLevel {
  phi = 'phi',
  unspecified = 'unspecified',
  primary = 'primary',
  unverified = 'unverified',
}

export enum ConsentingRelationshipCategory {
  CATEGORY_UNSPECIFIED = 0,
  /** CATEGORY_SELF - The account holder is the patient */
  CATEGORY_SELF = 1,
  /** CATEGORY_FAMILY_FRIEND - The account holder is a family member or friend of the patient */
  CATEGORY_FAMILY_FRIEND = 2,
  /** CATEGORY_CLINICIAN_ORGANIZATION - The account holder is a clinician or an organization */
  CATEGORY_CLINICIAN_ORGANIZATION = 3,
  /** CATEGORY_OTHER - None of the other options */
  CATEGORY_OTHER = 4,
}

export interface ConsentingRelationship {
  category: ConsentingRelationshipCategory;
}

export interface AccountPatient {
  id: number;
  accountId: number;
  // TODO: ON-1091 - change patient to verifiedPatient
  patient?: Patient;
  unverifiedPatient?: UnverifiedPatient;
  accessLevel: string;
  consentingRelationship: ConsentingRelationship;
  updatedAt?: string | Date;
  consistencyToken?: Uint8Array | string;
}

export interface PatientAssociation {
  unverifiedPatientId: number;
  consentingRelationship: ConsentingRelationship;
}
