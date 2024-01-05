import { GenderIdentityCategory } from '@*company-data-covered*/consumer-web-types';
import grpcMapper from '../patient.grpc.mapper';
import mapper from '../patient.mapper';
import {
  CREATE_GRPC_PATIENT_MOCK,
  CREATE_GRPC_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK,
  CREATE_PATIENT_MOCK,
  CREATE_PATIENT_TRANSFORMED_MOCK,
  CREATE_PATIENT_WITH_GUARANTOR_MOCK,
  CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_TRANSFORMED_MOCK,
  GRPC_UNVERIFIED_BODY_MOCK,
  GRPC_UNVERIFIED_PATIENT_MOCK,
  PATIENT_AOB_MOCK,
  PATIENT_SEARCH_PARAM_MOCK,
  PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK,
  STATION_PATIENT_MOCK,
  STATION_PATIENT_WITH_LAST_REQUEST_MOCK,
  TRANSFORMED_AOB_PATIENT,
  TRANSFORMED_AOB_PATIENT_WITH_LAST_REQUEST,
  TRANSFORMED_GRPC_PATIENT_MOCK,
  TRANSFORMED_GRPC_PATIENT_WITH_GUARANTOR_MOCK,
  TRANSFORMED_PATIENT_GRPC_SEARCH_PARAM_MOCK,
  TRANSFORMED_PATIENT_GRPC_SEARCH_WITH_ZIPCODE_PARAM_MOCK,
  TRANSFORMED_STATION_PATIENT,
  TRANSFORMED_STATION_PATIENT_WITH_GUARANTOR,
  TRANSFORMED_UPDATE_GRPC_PATIENT_MOCK,
  UNVERIFIED_PATIENT_MOCK,
  UPDATE_PATIENT_MOCK,
  // UNVERIFIED_PATIENT_MOCK,
} from './mocks/patient.mapper.mock';
import {
  GenderIdentity_Category,
  PhoneNumber,
  PhoneNumber_PhoneNumberType,
  Sex,
} from '@*company-data-covered*/protos/nest/common/demographic';
import {
  ContactInfo,
  RelationToPatient,
} from '@*company-data-covered*/protos/nest/common/patient';

describe('Patient mapper tests', () => {
  describe('transform whole objects', () => {
    it('transform station Patient into AOB Patient', async () => {
      const transformedResult =
        mapper.StationPatientToPatient(STATION_PATIENT_MOCK);
      expect(transformedResult).toEqual(TRANSFORMED_AOB_PATIENT);
    });

    it('transform station Patient with Last Care Request into AOB Patient', async () => {
      const transformedResult = mapper.StationPatientToPatient(
        STATION_PATIENT_WITH_LAST_REQUEST_MOCK
      );
      expect(transformedResult).toEqual(
        TRANSFORMED_AOB_PATIENT_WITH_LAST_REQUEST
      );
    });

    it('transform AOB Patient into station Patient', async () => {
      const transformedResult =
        mapper.PatientToStationPatient(PATIENT_AOB_MOCK);
      expect(transformedResult).toEqual(TRANSFORMED_STATION_PATIENT);
    });

    it('transform AOB Patient with guarantor into station Patient', async () => {
      const transformedResult = mapper.PatientToStationPatient(
        CREATE_PATIENT_WITH_GUARANTOR_MOCK
      );
      expect(transformedResult).toEqual(
        TRANSFORMED_STATION_PATIENT_WITH_GUARANTOR
      );
    });

    it('transform Patient into gRPC Patient', async () => {
      const transformedResult =
        grpcMapper.PatientToGrpcPatient(CREATE_PATIENT_MOCK);
      expect(transformedResult).toEqual(TRANSFORMED_GRPC_PATIENT_MOCK);
    });

    it('transform Patient into gRPC Patient with undefined billing city id', async () => {
      const CREATE_PATIENT_MOCK_WITHOUT_BILLING = {
        ...CREATE_PATIENT_MOCK,
        billingCityId: undefined,
      };

      const TRANSFORMED_GRPC_PATIENT_MOCK_WITHOUT_BILLING = {
        ...TRANSFORMED_GRPC_PATIENT_MOCK,
        billing_city: undefined,
      };

      const transformedResult = grpcMapper.PatientToGrpcPatient(
        CREATE_PATIENT_MOCK_WITHOUT_BILLING
      );
      expect(transformedResult).toEqual(
        TRANSFORMED_GRPC_PATIENT_MOCK_WITHOUT_BILLING
      );
    });

    it('transform Patient with guarantor into gRPC Patient', async () => {
      const transformedResult = grpcMapper.PatientToGrpcPatient(
        CREATE_PATIENT_WITH_GUARANTOR_MOCK
      );
      expect(transformedResult).toEqual(
        TRANSFORMED_GRPC_PATIENT_WITH_GUARANTOR_MOCK
      );
    });

    it('transform gRPC Patient into Patient', async () => {
      const transformedResult = grpcMapper.GrpcPatientToPatient(
        CREATE_GRPC_PATIENT_MOCK,
        new Uint8Array(8)
      );
      expect(transformedResult).toEqual(CREATE_PATIENT_TRANSFORMED_MOCK);
    });

    it('transform gRPC unverified Patient into Patient', async () => {
      const transformedResult =
        grpcMapper.GrpcUnverifiedPatientToUnverifiedPatient(
          GRPC_UNVERIFIED_PATIENT_MOCK,
          new Uint8Array(8)
        );
      expect(transformedResult).toEqual(UNVERIFIED_PATIENT_MOCK);
    });

    it('transform Patient into gRPC unverified Patient', async () => {
      const transformedResult =
        grpcMapper.CreateUnverifiedPatientToCreateGrpcUnverifiedPatient(
          UNVERIFIED_PATIENT_MOCK
        );
      expect(transformedResult).toEqual(GRPC_UNVERIFIED_BODY_MOCK);
    });

    it('transform Patient into gRPC unverified Patient with gender identity', async () => {
      const transformedResult =
        grpcMapper.CreateUnverifiedPatientToCreateGrpcUnverifiedPatient({
          ...UNVERIFIED_PATIENT_MOCK,
          genderIdentity: GenderIdentityCategory.CATEGORY_MALE,
        });
      expect(transformedResult).toEqual({
        ...GRPC_UNVERIFIED_BODY_MOCK,
        gender_identity: { category: GenderIdentity_Category.CATEGORY_MALE },
      });
    });

    it('transform gRPC Patient into Patient without guarantor information', async () => {
      const transformedResult = grpcMapper.GrpcPatientToPatient(
        CREATE_GRPC_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK,
        new Uint8Array(8)
      );
      expect(transformedResult).toEqual(
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_TRANSFORMED_MOCK
      );
    });

    it('transform Patient into gRPC Patient with patientId', async () => {
      const transformedResult = grpcMapper.PatientToGrpcPatient(
        UPDATE_PATIENT_MOCK,
        1
      );
      expect(transformedResult).toEqual(TRANSFORMED_UPDATE_GRPC_PATIENT_MOCK);
    });

    it('transform search of patients into gRPC Search', async () => {
      const transformedResult = grpcMapper.SearchPatientToGrpcSearchPatient(
        PATIENT_SEARCH_PARAM_MOCK
      );
      expect(transformedResult).toEqual(
        TRANSFORMED_PATIENT_GRPC_SEARCH_PARAM_MOCK
      );
    });

    it('transform search of patients with zipCode and dateOfBirth into gRPC Search', async () => {
      const transformedResult = grpcMapper.SearchPatientToGrpcSearchPatient(
        PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK
      );
      expect(transformedResult).toEqual(
        TRANSFORMED_PATIENT_GRPC_SEARCH_WITH_ZIPCODE_PARAM_MOCK
      );
    });
  });

  describe('transform by parts', () => {
    it('transform gender field', () => {
      const transformedFemaleSex = grpcMapper.protoSex('female');
      const transformedFemaleSex1 = grpcMapper.protoSex('Female');
      const transformedFemaleSex2 = grpcMapper.protoSex('f');
      const transformedFemaleSex3 = grpcMapper.protoSex('F');
      const transformedMaleSex = grpcMapper.protoSex('male');
      const transformedMaleSex1 = grpcMapper.protoSex('Male');
      const transformedMaleSex2 = grpcMapper.protoSex('m');
      const transformedMaleSex3 = grpcMapper.protoSex('M');
      const transformedOtherSex = grpcMapper.protoSex('other');
      const transformedUnspecifiedSex = grpcMapper.protoSex('');
      expect(transformedFemaleSex).toEqual(Sex.SEX_FEMALE);
      expect(transformedFemaleSex1).toEqual(Sex.SEX_FEMALE);
      expect(transformedFemaleSex2).toEqual(Sex.SEX_FEMALE);
      expect(transformedFemaleSex3).toEqual(Sex.SEX_FEMALE);
      expect(transformedMaleSex).toEqual(Sex.SEX_MALE);
      expect(transformedMaleSex1).toEqual(Sex.SEX_MALE);
      expect(transformedMaleSex2).toEqual(Sex.SEX_MALE);
      expect(transformedMaleSex3).toEqual(Sex.SEX_MALE);
      expect(transformedOtherSex).toEqual(Sex.SEX_OTHER);
      expect(transformedUnspecifiedSex).toEqual(Sex.SEX_UNSPECIFIED);
    });

    it('transform relation field', () => {
      const transformedSelf = grpcMapper.protoPatientRelation('patient');
      const transformedFamily = grpcMapper.protoPatientRelation('family');
      const transformedFamilyMother =
        grpcMapper.protoPatientRelation('family:mother');
      const transformedFamilyFather =
        grpcMapper.protoPatientRelation('family:father');
      const transformedFamilyChild =
        grpcMapper.protoPatientRelation('family:child');
      const transformedFamilySpouse =
        grpcMapper.protoPatientRelation('family:spouse');
      const transformedFriend = grpcMapper.protoPatientRelation('friend');
      const transformedCaseManager =
        grpcMapper.protoPatientRelation('case_manager');
      const transformedHomeHealthTeam =
        grpcMapper.protoPatientRelation('home_health_team');
      const transformedClinician = grpcMapper.protoPatientRelation('clinician');
      const transformedFacilityStaff =
        grpcMapper.protoPatientRelation('facility_staff');
      const transformedOther = grpcMapper.protoPatientRelation('Other');
      const transformedOther1 = grpcMapper.protoPatientRelation('other');
      const transformedCaregiverOrganization = grpcMapper.protoPatientRelation(
        'caregiver_organization'
      );
      const transformedElse = grpcMapper.protoPatientRelation('else');
      expect(transformedSelf).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_SELF
      );
      expect(transformedFamily).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_FAMILY
      );
      expect(transformedFamilyMother).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_FAMILY
      );
      expect(transformedFamilyFather).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_FAMILY
      );
      expect(transformedFamilyChild).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_FAMILY
      );
      expect(transformedFamilySpouse).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_FAMILY
      );
      expect(transformedFriend).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_FRIEND
      );
      expect(transformedCaseManager).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_CASE_MANAGEMENT
      );
      expect(transformedHomeHealthTeam).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_HOME_HEALTH_TEAM
      );
      expect(transformedClinician).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_CLINICIAN
      );
      expect(transformedFacilityStaff).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_FACILITY_STAFF
      );
      expect(transformedOther).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_OTHER
      );
      expect(transformedOther1).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_OTHER
      );
      expect(transformedCaregiverOrganization).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_UNSPECIFIED
      );
      expect(transformedElse).toEqual(
        RelationToPatient.RELATION_TO_PATIENT_UNSPECIFIED
      );
    });

    it('transform PhoneNumber enum', () => {
      const phoneNumber = '1234567890';

      const contactInfoWithMobile: ContactInfo = grpcMapper.protoPhoneNumber(
        phoneNumber,
        true
      );
      const mobileNumber: PhoneNumber = {
        phone_number: phoneNumber,
        phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
        country_code: 1,
      };

      const contactInfoWithHome = grpcMapper.protoPhoneNumber(phoneNumber);
      const homeNumber: PhoneNumber = {
        phone_number: phoneNumber,
        phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_HOME,
        country_code: 1,
      };

      const workNumber: PhoneNumber = {
        phone_number: phoneNumber,
        phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_WORK,
        country_code: 1,
      };

      const unrecognizedNumber: PhoneNumber = {
        phone_number: undefined,
        phone_number_type: PhoneNumber_PhoneNumberType.UNRECOGNIZED,
      };

      const mobileNumberObject = grpcMapper.onboardingPhoneNumber(
        contactInfoWithMobile
      );
      expect(mobileNumberObject).toEqual(mobileNumber);

      const homeNumberObject =
        grpcMapper.onboardingPhoneNumber(contactInfoWithHome);
      expect(homeNumberObject).toEqual(homeNumber);

      const workNumberObject = grpcMapper.onboardingPhoneNumber({
        work_number: {
          phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_WORK,
          country_code: 1,
          phone_number: phoneNumber,
        },
      });
      expect(workNumberObject).toEqual(workNumber);

      const unrecognizedNumberObject = grpcMapper.onboardingPhoneNumber({});
      expect(unrecognizedNumberObject).toEqual(unrecognizedNumber);
    });

    it('transform Sex enum', () => {
      const transformedFemaleSex = grpcMapper.onboardingGender(Sex.SEX_FEMALE);
      const transformedMaleSex = grpcMapper.onboardingGender(Sex.SEX_MALE);
      const transformedOtherSex = grpcMapper.onboardingGender(Sex.SEX_OTHER);
      const transformedUnspecifiedSex = grpcMapper.onboardingGender(
        Sex.SEX_UNSPECIFIED
      );
      expect(transformedFemaleSex).toEqual('female');
      expect(transformedMaleSex).toEqual('male');
      expect(transformedOtherSex).toEqual('other');
      expect(transformedUnspecifiedSex).toBeUndefined();
    });

    it('transform PatientRelation enum', () => {
      const transformedSelf = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_SELF
      );
      const transformedFamily = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_FAMILY
      );
      const transformedFriend = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_FRIEND
      );
      const transformedCaseManagement = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_CASE_MANAGEMENT
      );
      const transformedHomeHealthTeam = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_HOME_HEALTH_TEAM
      );
      const transformedClinician = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_CLINICIAN
      );
      const transformedFacilityStaff = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_FACILITY_STAFF
      );
      const transformedPatientOther = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_OTHER
      );
      const transformedUnspecified = grpcMapper.onboardingPatientRelation(
        RelationToPatient.RELATION_TO_PATIENT_UNSPECIFIED
      );
      expect(transformedSelf).toEqual('patient');
      expect(transformedFamily).toEqual('family:friend');
      expect(transformedFriend).toEqual('friend');
      expect(transformedCaseManagement).toEqual('case_manager');
      expect(transformedHomeHealthTeam).toEqual('home_health_team');
      expect(transformedClinician).toEqual('clinician');
      expect(transformedFacilityStaff).toEqual('facility_staff');
      expect(transformedPatientOther).toEqual('other');
      expect(transformedUnspecified).toEqual(undefined);
    });

    it('transform date', () => {
      const transformedDate = grpcMapper.protoDOB('31-01-1993');
      expect(transformedDate).toEqual({
        day: 31,
        month: 1,
        year: 1993,
      });
    });

    it('transform gRPC date', () => {
      const transformedDate = grpcMapper.onboardingDOB({
        day: 1,
        month: 1,
        year: 2000,
      });
      const transformedDate1 = grpcMapper.onboardingDOB({
        day: 1,
        month: 0,
        year: 2000,
      });
      expect(transformedDate).toEqual('2000-01-01');
      expect(transformedDate1).toEqual('1999-12-01');
    });
  });
});
