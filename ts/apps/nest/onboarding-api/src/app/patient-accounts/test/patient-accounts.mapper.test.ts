import { GenderIdentity_Category } from '@*company-data-covered*/protos/nest/common/demographic';
import mapper, {
  onboardingConsentingRelationship,
  onboardingGenderIdentityCategory,
  onboardingFacilityType,
  protoConsentingRelationship,
  protoGenderIdentityCategory,
  protoFacilityType,
} from '../patient-accounts.mapper';
import {
  ACCOUNT_ADDRESS_WITH_PLACE_OF_SERVICE_MOCK,
  ACCOUNT_ID_MOCK,
  CREATE_ACCOUNT_ADDRESS_RESPONSE_MOCK,
  CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK,
  OSS_ACCOUNT_ADDRESS_MOCK,
  PATIENT_ACCOUNT_MOCK,
  PATIENT_ASSOCIATION_MOCK,
  PATIENT_ASSOCIATION_PAYLOAD_MOCK,
  TRANSFORM_GRPC_ACCOUNT_ADDRESS_MOCK,
  TRANSFORM_GRPC_CREATE_ACCOUNT_ADDRESS_MOCK_PAYLOAD,
  TRANSFORM_GRPC_CREATE_ACCOUNT_ADDRESS_RESPONSE_MOCK,
  TRANSFORM_GRPC_CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK,
  TRANSFORM_GRPC_PATIENT_ACCOUNT_MOCK,
  TRANSFORM_GRPC_UPDATE_ACCOUNT_PAYLOAD_MOCK,
} from './mocks/patient-accounts.mapper.mock';
import {
  ACCOUNT_PATIENT_RESPONSE,
  ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE,
  GRPC_LIST_ACCOUNT_PATIENT_MOCK,
  GRPC_LIST_ACCOUNT_PATIENT_UNVERIFIED_MOCK,
} from './mocks/patient-accounts.service.mock';
import {
  ConsentingRelationshipCategory,
  GenderIdentityCategory,
  FacilityType,
} from '@*company-data-covered*/consumer-web-types';
import {
  ConsentingRelationship_Category,
  FacilityType as ProtoFacilityType,
} from '@*company-data-covered*/protos/nest/patients/accounts/service';

describe('Patient Accounts mapper tests', () => {
  describe('AccountToGrpcAccount mapper', () => {
    it('transform account into grpc account', () => {
      const transformedResult =
        mapper.AccountToGrpcAccount(PATIENT_ACCOUNT_MOCK);

      expect(transformedResult).toEqual(TRANSFORM_GRPC_PATIENT_ACCOUNT_MOCK);
    });

    it('transform account into grpc account with missing id in payload', () => {
      const transformedResult = mapper.AccountToGrpcAccount(
        {
          email: PATIENT_ACCOUNT_MOCK.email,
          firstName: PATIENT_ACCOUNT_MOCK.firstName,
          lastName: PATIENT_ACCOUNT_MOCK.lastName,
          phone: PATIENT_ACCOUNT_MOCK.phone,
        },
        PATIENT_ACCOUNT_MOCK.id
      );

      expect(transformedResult).toEqual(TRANSFORM_GRPC_PATIENT_ACCOUNT_MOCK);
    });
  });

  describe('GrpcAccountToAccount mapper', () => {
    it('transform grpc account into account', () => {
      const transformedResult = mapper.GrpcAccountToAccount(
        TRANSFORM_GRPC_PATIENT_ACCOUNT_MOCK
      );

      expect(transformedResult).toEqual(PATIENT_ACCOUNT_MOCK);
    });
  });

  describe('UpdateAccountRequestPayload mapper', () => {
    it('transform update account request', () => {
      const transformedRequest = mapper.UpdateAccountRequestPayload({
        ...PATIENT_ACCOUNT_MOCK,
        consistencyToken: new Uint8Array(8),
      });

      expect(transformedRequest).toEqual(
        TRANSFORM_GRPC_UPDATE_ACCOUNT_PAYLOAD_MOCK
      );
    });
  });

  describe('GrpcAccountAddressToAccountAddress mapper', () => {
    it('transform grpc create/update account address response into account address', () => {
      const transformedRequest = mapper.GrpcAccountAddressToAccountAddress(
        TRANSFORM_GRPC_CREATE_ACCOUNT_ADDRESS_RESPONSE_MOCK
      );

      expect(transformedRequest).toEqual(CREATE_ACCOUNT_ADDRESS_RESPONSE_MOCK);
    });

    it('transform grpc create/update account suggested address response into account address', () => {
      const transformedRequest = mapper.GrpcAccountAddressToAccountAddress(
        TRANSFORM_GRPC_CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK
      );

      expect(transformedRequest).toEqual(
        CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK
      );
    });
  });

  describe('GrpcAddressToAddress mapper', () => {
    it('transform grpc address into address', () => {
      const transformedRequest = mapper.GrpcAddressToAddress(
        TRANSFORM_GRPC_ACCOUNT_ADDRESS_MOCK
      );

      expect(transformedRequest).toEqual(OSS_ACCOUNT_ADDRESS_MOCK);
    });
  });

  describe('createAddressPayload mapper', () => {
    it('transform create account address request', () => {
      const transformedRequest = mapper.createAddressPayload(
        ACCOUNT_ADDRESS_WITH_PLACE_OF_SERVICE_MOCK,
        ACCOUNT_ID_MOCK
      );

      expect(transformedRequest).toEqual(
        TRANSFORM_GRPC_CREATE_ACCOUNT_ADDRESS_MOCK_PAYLOAD
      );
    });
  });

  describe('GrpcListAccountPatientsToListAccountPatient mapper', () => {
    it('transform list account patients request with Patient object', () => {
      const transformedRequest = mapper.GrpcAccountPatientToAccountPatient(
        GRPC_LIST_ACCOUNT_PATIENT_MOCK,
        new Uint8Array(8)
      );

      expect(transformedRequest).toEqual(ACCOUNT_PATIENT_RESPONSE);
    });

    it('transform list account patients request with Unverified Patient object', () => {
      const transformedRequest = mapper.GrpcAccountPatientToAccountPatient(
        GRPC_LIST_ACCOUNT_PATIENT_UNVERIFIED_MOCK,
        new Uint8Array(8)
      );

      expect(transformedRequest).toEqual(
        ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE
      );
    });
  });

  describe('addUnverifiedAccountPatientLinkPayload mapper', () => {
    it('transform addUnverifiedAccountPatientLinkPayload', () => {
      const transformedRequest = mapper.addUnverifiedAccountPatientLinkPayload(
        PATIENT_ASSOCIATION_MOCK,
        1
      );

      expect(transformedRequest).toEqual(PATIENT_ASSOCIATION_PAYLOAD_MOCK);
    });
  });

  describe('onboardingFacilityType', () => {
    it.each([
      {
        input: ProtoFacilityType.FACILITY_TYPE_UNSPECIFIED,
        expected: FacilityType.FACILITY_TYPE_UNSPECIFIED,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_HOME,
        expected: FacilityType.FACILITY_TYPE_HOME,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_WORK,
        expected: FacilityType.FACILITY_TYPE_WORK,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY,
        expected: FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY,
        expected: FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY,
        expected: FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_CLINIC,
        expected: FacilityType.FACILITY_TYPE_CLINIC,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY,
        expected: FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_REHABILITATION_FACILITY,
        expected: FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_VIRTUAL_VISIT,
        expected: FacilityType.FACILITY_TYPE_VIRTUAL_VISIT,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING,
        expected: FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING,
      },
      {
        input: ProtoFacilityType.FACILITY_TYPE_SCHOOL,
        expected: FacilityType.FACILITY_TYPE_SCHOOL,
      },
      {
        input: undefined,
        expected: ProtoFacilityType.UNRECOGNIZED,
      },
    ])('should work correctly for $input', ({ input, expected }) => {
      expect(onboardingFacilityType(input)).toBe(expected);
    });
  });

  describe('protoFacilityType', () => {
    it.each([
      {
        input: FacilityType.FACILITY_TYPE_UNSPECIFIED,
        expected: ProtoFacilityType.FACILITY_TYPE_UNSPECIFIED,
      },
      {
        input: FacilityType.FACILITY_TYPE_HOME,
        expected: ProtoFacilityType.FACILITY_TYPE_HOME,
      },
      {
        input: FacilityType.FACILITY_TYPE_WORK,
        expected: ProtoFacilityType.FACILITY_TYPE_WORK,
      },
      {
        input: FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY,
        expected: ProtoFacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY,
      },
      {
        input: FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY,
        expected: ProtoFacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY,
      },
      {
        input: FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY,
        expected: ProtoFacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY,
      },
      {
        input: FacilityType.FACILITY_TYPE_CLINIC,
        expected: ProtoFacilityType.FACILITY_TYPE_CLINIC,
      },
      {
        input: FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY,
        expected: ProtoFacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY,
      },
      {
        input: FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY,
        expected: ProtoFacilityType.FACILITY_TYPE_REHABILITATION_FACILITY,
      },
      {
        input: FacilityType.FACILITY_TYPE_VIRTUAL_VISIT,
        expected: ProtoFacilityType.FACILITY_TYPE_VIRTUAL_VISIT,
      },
      {
        input: FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING,
        expected: ProtoFacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING,
      },
      {
        input: FacilityType.FACILITY_TYPE_SCHOOL,
        expected: ProtoFacilityType.FACILITY_TYPE_SCHOOL,
      },
      {
        input: undefined,
        expected: ProtoFacilityType.UNRECOGNIZED,
      },
    ])('should work correctly for $input', ({ input, expected }) => {
      expect(protoFacilityType(input)).toBe(expected);
    });
  });

  describe('onboardingGenderIdentityCategory', () => {
    it.each([
      {
        input: GenderIdentity_Category.CATEGORY_UNSPECIFIED,
        expected: GenderIdentityCategory.CATEGORY_UNSPECIFIED,
      },
      {
        input: GenderIdentity_Category.CATEGORY_MALE,
        expected: GenderIdentityCategory.CATEGORY_MALE,
      },
      {
        input: GenderIdentity_Category.CATEGORY_FEMALE,
        expected: GenderIdentityCategory.CATEGORY_FEMALE,
      },
      {
        input: GenderIdentity_Category.CATEGORY_FEMALE_TO_MALE,
        expected: GenderIdentityCategory.CATEGORY_FEMALE_TO_MALE,
      },
      {
        input: GenderIdentity_Category.CATEGORY_MALE_TO_FEMALE,
        expected: GenderIdentityCategory.CATEGORY_MALE_TO_FEMALE,
      },
      {
        input: GenderIdentity_Category.CATEGORY_NON_BINARY,
        expected: GenderIdentityCategory.CATEGORY_NON_BINARY,
      },
      {
        input: GenderIdentity_Category.CATEGORY_UNDISCLOSED,
        expected: GenderIdentityCategory.CATEGORY_UNDISCLOSED,
      },
      {
        input: GenderIdentity_Category.CATEGORY_OTHER,
        expected: GenderIdentityCategory.CATEGORY_OTHER,
      },
      {
        input: -12 as never,
        expected: undefined,
      },
      {
        input: undefined,
        expected: undefined,
      },
    ])('should work correctly for $input', ({ input, expected }) => {
      expect(onboardingGenderIdentityCategory(input)).toBe(expected);
    });
  });

  describe('protoGenderIdentityCategory', () => {
    it.each([
      {
        input: GenderIdentityCategory.CATEGORY_UNSPECIFIED,
        expected: GenderIdentity_Category.CATEGORY_UNSPECIFIED,
      },
      {
        input: GenderIdentityCategory.CATEGORY_MALE,
        expected: GenderIdentity_Category.CATEGORY_MALE,
      },
      {
        input: GenderIdentityCategory.CATEGORY_FEMALE,
        expected: GenderIdentity_Category.CATEGORY_FEMALE,
      },
      {
        input: GenderIdentityCategory.CATEGORY_FEMALE_TO_MALE,
        expected: GenderIdentity_Category.CATEGORY_FEMALE_TO_MALE,
      },
      {
        input: GenderIdentityCategory.CATEGORY_MALE_TO_FEMALE,
        expected: GenderIdentity_Category.CATEGORY_MALE_TO_FEMALE,
      },
      {
        input: GenderIdentityCategory.CATEGORY_NON_BINARY,
        expected: GenderIdentity_Category.CATEGORY_NON_BINARY,
      },
      {
        input: GenderIdentityCategory.CATEGORY_UNDISCLOSED,
        expected: GenderIdentity_Category.CATEGORY_UNDISCLOSED,
      },
      {
        input: GenderIdentityCategory.CATEGORY_OTHER,
        expected: GenderIdentity_Category.CATEGORY_OTHER,
      },
      {
        input: -12 as never,
        expected: undefined,
      },
      {
        input: undefined,
        expected: undefined,
      },
    ])('should work correctly for $input', ({ input, expected }) => {
      expect(protoGenderIdentityCategory(input)).toBe(expected);
    });
  });

  describe('protoConsentingRelationship', () => {
    it.each([
      {
        input: {
          category: ConsentingRelationshipCategory.CATEGORY_UNSPECIFIED,
        },
        expected: {
          category: ConsentingRelationship_Category.CATEGORY_UNSPECIFIED,
        },
      },
      {
        input: {
          category: ConsentingRelationshipCategory.CATEGORY_SELF,
        },
        expected: { category: ConsentingRelationship_Category.CATEGORY_SELF },
      },
      {
        input: {
          category: ConsentingRelationshipCategory.CATEGORY_FAMILY_FRIEND,
        },
        expected: {
          category: ConsentingRelationship_Category.CATEGORY_FAMILY_FRIEND,
        },
      },
      {
        input: {
          category:
            ConsentingRelationshipCategory.CATEGORY_CLINICIAN_ORGANIZATION,
        },
        expected: {
          category:
            ConsentingRelationship_Category.CATEGORY_CLINICIAN_ORGANIZATION,
        },
      },
      {
        input: {
          category: ConsentingRelationshipCategory.CATEGORY_OTHER,
        },
        expected: { category: ConsentingRelationship_Category.CATEGORY_OTHER },
      },
    ])('should work correctly for $input', ({ input, expected }) => {
      expect(protoConsentingRelationship(input)).toStrictEqual(expected);
    });
  });

  describe('onboardingConsentingRelationship', () => {
    it.each([
      {
        input: {
          category: ConsentingRelationship_Category.CATEGORY_UNSPECIFIED,
        },
        expected: {
          category: ConsentingRelationshipCategory.CATEGORY_UNSPECIFIED,
        },
      },
      {
        input: {
          category: ConsentingRelationship_Category.CATEGORY_SELF,
        },
        expected: { category: ConsentingRelationshipCategory.CATEGORY_SELF },
      },
      {
        input: {
          category: ConsentingRelationship_Category.CATEGORY_FAMILY_FRIEND,
        },
        expected: {
          category: ConsentingRelationshipCategory.CATEGORY_FAMILY_FRIEND,
        },
      },
      {
        input: {
          category:
            ConsentingRelationship_Category.CATEGORY_CLINICIAN_ORGANIZATION,
        },
        expected: {
          category:
            ConsentingRelationshipCategory.CATEGORY_CLINICIAN_ORGANIZATION,
        },
      },
      {
        input: {
          category: ConsentingRelationship_Category.CATEGORY_OTHER,
        },
        expected: { category: ConsentingRelationshipCategory.CATEGORY_OTHER },
      },
    ])('should work correctly for $input', ({ input, expected }) => {
      expect(onboardingConsentingRelationship(input)).toStrictEqual(expected);
    });
  });
});
