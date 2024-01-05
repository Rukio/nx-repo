import {
  mockCreatePatientAccountUnverifiedPatientPayload,
  mockMarketsAvailabilityZipCode,
  mockPatientAccountVerifiedPatient,
  mockUpdatePatientAccountPayload,
} from '../../domain';
import { AssignedSexAtBirth, GenderIdentity } from '../../types';
import {
  UpdatePatientDemographicsPayload,
  UpsertPatientPayload,
} from './types';

export const mockUpdatePatientDemographicsPayload: UpdatePatientDemographicsPayload =
  {
    patientFirstName:
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .givenName,
    patientLastName:
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .familyName,
    legalSex:
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .legalSex,
    assignedSexAtBirth: AssignedSexAtBirth.Male,
    patientPhone:
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .phoneNumber,
    birthday:
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient.dateOfBirth.toString(),
    genderIdentity: GenderIdentity.Male,
    genderIdentityDetails:
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .genderIdentityDetails,
    requesterFirstName: mockUpdatePatientAccountPayload.firstName,
    requesterLastName: mockUpdatePatientAccountPayload.lastName,
    requesterPhone: mockUpdatePatientAccountPayload.phone,
    patientMiddleName: mockPatientAccountVerifiedPatient.middleName,
    patientSuffix: mockPatientAccountVerifiedPatient.suffix,
  };

export const mockUpsertPatientPayload: UpsertPatientPayload = {
  billingCityId: mockMarketsAvailabilityZipCode.billingCityId,
};
