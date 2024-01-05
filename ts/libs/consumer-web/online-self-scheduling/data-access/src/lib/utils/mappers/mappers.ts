import { format, isValid } from 'date-fns';
import {
  InsuranceParams,
  InsuranceClassification,
  InsuranceNetwork,
  ConsentingRelationshipCategory,
  GenderIdentityCategory,
  Patient,
  UnverifiedPatient,
  BirthSex,
  FacilityType,
} from '@*company-data-covered*/consumer-web-types';
import {
  CheckInsuranceEligibilityPayload,
  CreatePatientAccountAddressPayload,
  CreatePatientAccountUnverifiedPatientPayload,
  UpdatePatientAccountPayload,
  UpdatePatientAccountAddressPayload,
} from '../../domain';
import {
  AssignedSexAtBirth,
  PatientAccountAddressData,
  RelationToPatient,
  GenderIdentity,
  DomainPatientAccountAddress,
  InsurancePayerData,
  InsurancePayerFromNetwork,
  InsurancePriority,
  DomainPatient,
  PatientAccount,
  DomainRiskStratificationProtocol,
  SelfScheduleData,
  DomainUnverifiedPatient,
  FacilityTypeName,
  PatientAddress,
  DomainChannelItem,
} from '../../types';
import {
  UpdatePatientDemographicsPayload,
  CreateSelfSchedulingCareRequestPayload,
  CachePatientPOAPayload,
} from '../../feature';
import { PatientAddressOption } from '../../feature/managePatientAddressSlice/types';

export const SYMPTOMS_DIVIDER = ' | ';

export const SYMPTOMS_COMMA_DIVIDER_REGEX = /, /g;

export const preparePatientAccountAddressRequestData = (
  accountId: number,
  address: PatientAccountAddressData
): CreatePatientAccountAddressPayload => ({
  accountId: accountId,
  city: address.city ?? '',
  state: address.state ?? '',
  zip: address.zipCode ?? '',
  streetAddress1: address.streetAddress1 ?? '',
  streetAddress2: address?.streetAddress2 ?? '',
  additionalDetails: address?.locationDetails ?? '',
  facilityType: toFacilityType(address.locationType),
});

export const prepareUpdatePatientAddressRequestData = ({
  accountId,
  addressId,
  consistencyToken,
  address,
}: {
  accountId: number;
  addressId: number;
  consistencyToken: Uint8Array | string;
  address: PatientAccountAddressData;
}): UpdatePatientAccountAddressPayload => ({
  ...preparePatientAccountAddressRequestData(accountId, address),
  id: addressId,
  consistencyToken,
});

const getPatientRelationshipToInsured = (
  isRequesterRelationshipSelf: boolean
) => (isRequesterRelationshipSelf ? 'self' : RelationToPatient.Other);

export const prepareInsuranceParams = ({
  memberId,
  isRequesterRelationshipSelf,
  selectedNetwork,
  patient,
  insurancePriority,
}: {
  memberId: string;
  isRequesterRelationshipSelf: boolean;
  selectedNetwork?: CheckInsuranceEligibilityPayload['selectedNetwork'];
  patient?: CheckInsuranceEligibilityPayload['patient'];
  insurancePriority?: InsurancePriority;
}): InsuranceParams => ({
  priority: insurancePriority || InsurancePriority.PRIMARY,
  memberId,
  packageId: selectedNetwork?.packageId ?? '',
  companyName: selectedNetwork?.name ?? '',
  insurancePlanId: Number(selectedNetwork?.insurancePlanId),
  primaryInsuranceHolderToggle: isRequesterRelationshipSelf
    ? RelationToPatient.Patient
    : RelationToPatient.Other,
  insuredSameAsPatient: true,
  patientRelationToSubscriber: isRequesterRelationshipSelf
    ? RelationToPatient.Patient
    : RelationToPatient.Other,
  patientRelationshipToInsured: getPatientRelationshipToInsured(
    isRequesterRelationshipSelf
  ),
  firstName: patient?.firstName ?? '',
  middleInitial: patient?.middleName ?? '',
  lastName: patient?.lastName ?? '',
  gender: patient?.gender ?? '',
  primaryInsuranceHolderAttributes: {
    firstName: patient?.firstName ?? '',
    middleInitial: patient?.middleName ?? '',
    lastName: patient?.lastName ?? '',
    gender: patient?.gender ?? '',
    patientRelationshipToInsured: getPatientRelationshipToInsured(
      isRequesterRelationshipSelf
    ),
  },
});

export const prepareUpdatePatientDemographicsRequestData = (
  data: UpdatePatientDemographicsPayload
): {
  account: Omit<UpdatePatientAccountPayload, 'id' | 'consistencyToken'>;
  patient: CreatePatientAccountUnverifiedPatientPayload['unverifiedPatient'] &
    Pick<DomainPatient, 'middleName' | 'suffix'>;
} => ({
  account: {
    firstName: data.requesterFirstName,
    lastName: data.requesterLastName,
    phone: data.requesterPhone,
  },
  patient: {
    givenName: data.patientFirstName,
    familyName: data.patientLastName,
    middleName: data.patientMiddleName,
    suffix: data.patientSuffix,
    phoneNumber: data.patientPhone,
    dateOfBirth: data.birthday
      ? format(new Date(data.birthday), 'yyyy-MM-dd')
      : undefined,
    legalSex: data.legalSex,
    birthSex: toBirthSex(data.assignedSexAtBirth),
    genderIdentity: toGenderIdentityCategory(data.genderIdentity),
    genderIdentityDetails: data.genderIdentityDetails,
  },
});

export const toBirthSex = (value?: AssignedSexAtBirth | string): BirthSex => {
  switch (value) {
    case AssignedSexAtBirth.Male:
      return BirthSex.BIRTH_SEX_MALE;
    case AssignedSexAtBirth.Female:
      return BirthSex.BIRTH_SEX_FEMALE;
    case AssignedSexAtBirth.ChooseNotToDisclose:
      return BirthSex.BIRTH_SEX_UNDISCLOSED;
    case AssignedSexAtBirth.Unknown:
      return BirthSex.BIRTH_SEX_UNKNOWN;
    case undefined:
      return BirthSex.BIRTH_SEX_UNSPECIFIED;
    default:
      return BirthSex.UNRECOGNIZED;
  }
};

export const toGenderIdentityCategory = (value?: GenderIdentity | string) => {
  switch (value) {
    case GenderIdentity.Male:
      return GenderIdentityCategory.CATEGORY_MALE;
    case GenderIdentity.Female:
      return GenderIdentityCategory.CATEGORY_FEMALE;
    case GenderIdentity.MaleToFemale:
      return GenderIdentityCategory.CATEGORY_MALE_TO_FEMALE;
    case GenderIdentity.FemaleToMale:
      return GenderIdentityCategory.CATEGORY_FEMALE_TO_MALE;
    case GenderIdentity.NonBinary:
      return GenderIdentityCategory.CATEGORY_NON_BINARY;
    case GenderIdentity.Other:
      return GenderIdentityCategory.CATEGORY_OTHER;
    case GenderIdentity.Unknown:
      return GenderIdentityCategory.CATEGORY_UNDISCLOSED;
    case undefined:
      return GenderIdentityCategory.CATEGORY_UNSPECIFIED;
    default:
      return GenderIdentityCategory.UNRECOGNIZED;
  }
};

export const toConsentingRelationshipCategory = (
  value?: RelationToPatient | string
): ConsentingRelationshipCategory => {
  switch (value) {
    case RelationToPatient.Patient:
      return ConsentingRelationshipCategory.CATEGORY_SELF;
    case RelationToPatient.FamilyFriend:
      return ConsentingRelationshipCategory.CATEGORY_FAMILY_FRIEND;
    case RelationToPatient.Clinician:
      return ConsentingRelationshipCategory.CATEGORY_CLINICIAN_ORGANIZATION;
    case RelationToPatient.Other:
      return ConsentingRelationshipCategory.CATEGORY_OTHER;
    default:
      return ConsentingRelationshipCategory.CATEGORY_UNSPECIFIED;
  }
};

export const transformAddressParts = (
  parts: (string | number | undefined)[],
  separator = ', '
) => parts.filter(Boolean).join(separator);

export const toFormattedAddress = (address?: PatientAddress | null): string => {
  if (!address) {
    return '';
  }

  return transformAddressParts([
    address.streetAddress1,
    transformAddressParts([address.streetAddress2, address.city], ' '),
    transformAddressParts([address.state, address.zip], ' '),
  ]);
};

export const transformDomainPatientAddressTo = (
  address: DomainPatientAccountAddress
): PatientAddressOption => ({
  value: String(address.id || ''),
  label: toFormattedAddress(address),
  zip: address.zip,
});

export const transformDomainPatientAddressesTo = (
  addresses: DomainPatientAccountAddress[]
): PatientAddressOption[] => addresses.map(transformDomainPatientAddressTo);

export const transformAddressDataToPatientAddress = (
  address?: PatientAccountAddressData
): PatientAddress => ({
  city: address?.city ?? '',
  state: address?.state ?? '',
  zip: address?.zipCode ?? '',
  streetAddress1: address?.streetAddress1 ?? '',
  streetAddress2: address?.streetAddress2 ?? '',
  additionalDetails: address?.locationDetails ?? '',
});

export const transformNetworksToPayers = (
  networks?: InsuranceNetwork[]
): InsurancePayerFromNetwork[] =>
  networks
    ? [
        ...new Map(
          networks
            .map((network) => ({
              id: network.insurancePayerId.toString(),
              name: network.insurancePayerName,
              classificationId: network.insuranceClassificationId.toString(),
              stateAbbrs: network.stateAbbrs,
            }))
            .map((item) => [item['id'], item])
        ).values(),
      ]
    : [];

export const transformPayerWithClassificationName = (
  payers?: InsurancePayerFromNetwork[],
  classifications?: InsuranceClassification[]
): InsurancePayerData[] =>
  payers?.map((payer) => ({
    ...payer,
    classificationName: classifications?.find(
      (classification) =>
        classification.id.toString() === payer.classificationId
    )?.name,
  })) ?? [];

const isUnverifiedPatient = (
  patient: Patient | DomainUnverifiedPatient | PatientAccount
): patient is DomainUnverifiedPatient => {
  return 'givenName' in patient;
};

const toFullName = (firstName = '', lastName = '') => {
  return `${firstName} ${lastName}`;
};

const extractPatientFields = (
  patient: Patient | DomainUnverifiedPatient | PatientAccount
) => {
  const name = toFullName(
    isUnverifiedPatient(patient) ? patient.givenName : patient.firstName,
    isUnverifiedPatient(patient) ? patient.familyName : patient.lastName
  );
  const phone = isUnverifiedPatient(patient)
    ? patient.phoneNumber || ''
    : patient.phone || '';

  return {
    name,
    phone,
    relationship: RelationToPatient.Patient,
  };
};

export const prepareUpdatePOARequestData = (
  data: CachePatientPOAPayload,
  patientData: PatientAccount | Patient | UnverifiedPatient
): DomainPatient['powerOfAttorney'] => {
  const isPatientDecisionMaker = data.isPatientDecisionMaker;

  if (isPatientDecisionMaker) {
    return extractPatientFields(patientData);
  }

  return {
    name: toFullName(data.firstName, data.lastName),
    phone: data.phoneNumber || '',
    relationship: RelationToPatient.Other,
  };
};

export const toSeparatedSymptomsString = (symptoms?: string) => {
  if (!symptoms) {
    return '';
  }

  return symptoms
    .trim()
    .replace(SYMPTOMS_COMMA_DIVIDER_REGEX, SYMPTOMS_DIVIDER);
};

export const prepareCreateSelfSchedulingCareRequestPayload = ({
  powerOfAttorneyId,
  unverifiedPatient,
  riskStratificationProtocol,
  selfScheduleData,
  patientAddress,
  patientAccount,
  channelItem,
  riskAssessmentScore = 0,
  isRiskAssessmentRequired = false,
  isRequesterRelationshipSelf = false,
}: {
  powerOfAttorneyId?: string | number;
  unverifiedPatient?: DomainUnverifiedPatient | null;
  riskStratificationProtocol?: DomainRiskStratificationProtocol | null;
  selfScheduleData?: SelfScheduleData | null;
  patientAddress?: DomainPatientAccountAddress | null;
  patientAccount?: PatientAccount;
  channelItem?: DomainChannelItem;
  riskAssessmentScore?: number;
  isRiskAssessmentRequired?: boolean;
  isRequesterRelationshipSelf: boolean;
}): CreateSelfSchedulingCareRequestPayload => {
  const separatedSymptoms = toSeparatedSymptomsString(
    selfScheduleData?.symptoms
  );

  const complaintSymptom = separatedSymptoms.split(SYMPTOMS_DIVIDER)[0] ?? '';

  const patientPreferredEtaStartDate = new Date(
    selfScheduleData?.preferredEta?.patientPreferredEtaStart || ''
  );

  const patientPreferredEtaEndDate = new Date(
    selfScheduleData?.preferredEta?.patientPreferredEtaEnd || ''
  );

  const isPatientPreferredEta =
    isValid(patientPreferredEtaStartDate) &&
    isValid(patientPreferredEtaEndDate);

  const requesterFirstName = isRequesterRelationshipSelf
    ? unverifiedPatient?.givenName
    : patientAccount?.firstName;
  const requesterLastName = isRequesterRelationshipSelf
    ? unverifiedPatient?.familyName
    : patientAccount?.lastName;
  const requesterPhone = isRequesterRelationshipSelf
    ? unverifiedPatient?.phoneNumber
    : patientAccount?.phone;

  return {
    mpoaConsent: {
      powerOfAttorneyId: Number(powerOfAttorneyId),
    },
    careRequest: {
      marketId: Number(selfScheduleData?.marketId),
      patientId: Number(unverifiedPatient?.patientId),
      placeOfService:
        toFacilityTypeName(patientAddress?.facilityType) ||
        FacilityTypeName.Home,
      requester: {
        firstName: requesterFirstName,
        lastName: requesterLastName,
        phone: requesterPhone,
        relationToPatient: selfScheduleData?.requester?.relationToPatient,
        organizationName: channelItem?.name,
      },
      address: {
        city: patientAddress?.city,
        state: patientAddress?.state,
        zip: patientAddress?.zip,
        streetAddress1: patientAddress?.streetAddress1,
        streetAddress2: patientAddress?.streetAddress2,
        additionalDetails: patientAddress?.additionalDetails,
      },
      complaint: {
        symptoms: separatedSymptoms,
      },
      channelItemId: Number(channelItem?.id),
      ...(isPatientPreferredEta && {
        patientPreferredEta: {
          patientPreferredEtaStart: patientPreferredEtaStartDate.toISOString(),
          patientPreferredEtaEnd: patientPreferredEtaEndDate.toISOString(),
        },
      }),
    },
    ...(isRiskAssessmentRequired && {
      riskAssessment: {
        dob: unverifiedPatient?.dateOfBirth?.toString() || '',
        gender: unverifiedPatient?.legalSex || '',
        worstCaseScore: riskAssessmentScore,
        score: riskAssessmentScore,
        protocolId: Number(riskStratificationProtocol?.id),
        protocolName: riskStratificationProtocol?.name || '',
        overrideReason: '',
        complaint: {
          symptom: complaintSymptom,
          selectedSymptoms: separatedSymptoms,
        },
        responses: {
          questions: riskStratificationProtocol?.questions ?? [],
        },
      },
    }),
  };
};

export const toFacilityType = (
  facilityTypeName?: FacilityTypeName | string
) => {
  switch (facilityTypeName) {
    case FacilityTypeName.Home:
      return FacilityType.FACILITY_TYPE_HOME;
    case FacilityTypeName.IndependentLivingFacility:
      return FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY;
    case FacilityTypeName.SeniorLivingTesting:
      return FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING;
    case FacilityTypeName.AssistedLivingFacility:
      return FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY;
    case FacilityTypeName.Clinic:
      return FacilityType.FACILITY_TYPE_CLINIC;
    case FacilityTypeName.LongTermCareFacility:
      return FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY;
    case FacilityTypeName.RehabilitationFacility:
      return FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY;
    case FacilityTypeName.School:
      return FacilityType.FACILITY_TYPE_SCHOOL;
    case FacilityTypeName.SkilledNursingFacility:
      return FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY;
    case FacilityTypeName.VirtualVisit:
      return FacilityType.FACILITY_TYPE_VIRTUAL_VISIT;
    case FacilityTypeName.Work:
      return FacilityType.FACILITY_TYPE_WORK;
    case FacilityTypeName.Hotel:
      return FacilityType.FACILITY_TYPE_HOTEL;
    case undefined:
      return FacilityType.FACILITY_TYPE_UNSPECIFIED;
    default:
      return FacilityType.UNRECOGNIZED;
  }
};

export const toFacilityTypeName = (facilityType?: FacilityType) => {
  switch (facilityType) {
    case FacilityType.FACILITY_TYPE_HOME:
      return FacilityTypeName.Home;
    case FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY:
      return FacilityTypeName.IndependentLivingFacility;
    case FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING:
      return FacilityTypeName.SeniorLivingTesting;
    case FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY:
      return FacilityTypeName.AssistedLivingFacility;
    case FacilityType.FACILITY_TYPE_CLINIC:
      return FacilityTypeName.Clinic;
    case FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY:
      return FacilityTypeName.LongTermCareFacility;
    case FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY:
      return FacilityTypeName.RehabilitationFacility;
    case FacilityType.FACILITY_TYPE_SCHOOL:
      return FacilityTypeName.School;
    case FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY:
      return FacilityTypeName.SkilledNursingFacility;
    case FacilityType.FACILITY_TYPE_VIRTUAL_VISIT:
      return FacilityTypeName.VirtualVisit;
    case FacilityType.FACILITY_TYPE_WORK:
      return FacilityTypeName.Work;
    case FacilityType.FACILITY_TYPE_HOTEL:
      return FacilityTypeName.Hotel;
    default:
      return undefined;
  }
};
