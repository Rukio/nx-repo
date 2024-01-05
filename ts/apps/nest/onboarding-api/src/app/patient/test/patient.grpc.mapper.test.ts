import mapper, {
  onboardingBirthSex,
  onboardingPatientSafetyFlag,
  protoBirthSex,
  protoPatientSafetyFlag,
} from '../patient.grpc.mapper';
import {
  GRPC_PATIENT_SEARCH_RESULTS,
  INSURANCE_PARAMS_MOCK,
  INSURANCE_RECORD_MOCK,
  PATIENT_INSURANCE_MOCK,
  GRPC_UNVERIFIED_PATIENT_MOCK,
  UNVERIFIED_PATIENT_MOCK,
} from './mocks/patient.mapper.mock';
import { SearchPatientsResult } from '@*company-data-covered*/protos/nest/patients/service';
import grpcMapper from '../patient.grpc.mapper';
import {
  InsurancePriority,
  PatientRelationToSubscriber,
} from '@*company-data-covered*/protos/nest/patients/insurance';
import { EligibilityStatus } from '@*company-data-covered*/protos/nest/insurance_eligibility/insurance_eligibility';
import {
  PatientSafetyFlag_FlagType,
  RelationToPatient,
} from '@*company-data-covered*/protos/nest/common/patient';
import {
  BirthSex,
  GenderIdentityCategory,
} from '@*company-data-covered*/consumer-web-types';
import {
  BirthSex as ProtoBirthSex,
  GenderIdentity_Category,
} from '@*company-data-covered*/protos/nest/common/demographic';

const PatientRelationshipToGrpcInsuredToPatientRelationData = [
  ['self', { relation: RelationToPatient.RELATION_TO_PATIENT_SELF }],
  [
    'facility staff',
    { relation: RelationToPatient.RELATION_TO_PATIENT_FACILITY_STAFF },
  ],
  ['family', { relation: RelationToPatient.RELATION_TO_PATIENT_FAMILY }],
  ['clinician', { relation: RelationToPatient.RELATION_TO_PATIENT_CLINICIAN }],
  ['friend', { relation: RelationToPatient.RELATION_TO_PATIENT_FRIEND }],
  [
    'home health team',
    { relation: RelationToPatient.RELATION_TO_PATIENT_HOME_HEALTH_TEAM },
  ],
  [
    'case management',
    { relation: RelationToPatient.RELATION_TO_PATIENT_CASE_MANAGEMENT },
  ],
  [
    'other',
    {
      relation: RelationToPatient.RELATION_TO_PATIENT_OTHER,
      other_relation_text: 'other',
    },
  ],
  [
    '',
    {
      relation: RelationToPatient.RELATION_TO_PATIENT_UNSPECIFIED,
      other_relation_text: '',
    },
  ],
];

describe('Patient Grpc mapper tests', () => {
  describe('SortSearchResults', () => {
    it('order of items should change', () => {
      const sortedResults = mapper.sortSearchResults(
        GRPC_PATIENT_SEARCH_RESULTS
      );
      expect(sortedResults).not.toEqual(GRPC_PATIENT_SEARCH_RESULTS);
    });

    it("order of items shouldn't change", () => {
      const searchResults: SearchPatientsResult[] = [
        {
          patient: {
            ...GRPC_PATIENT_SEARCH_RESULTS[0].patient,
            id: '3',
          },
        },
        {
          patient: {
            ...GRPC_PATIENT_SEARCH_RESULTS[0].patient,
            id: '2',
          },
        },
      ];
      const sortedResults = mapper.sortSearchResults(searchResults);
      expect(sortedResults).toEqual(searchResults);
    });

    it("shouldn't throw error because of emtpy results", () => {
      const sortedResults = mapper.sortSearchResults([]);
      expect(sortedResults).toEqual([]);
    });

    it("shouldn't throw error because of emtpy results", () => {
      const sortedResults = mapper.sortSearchResults(undefined);
      expect(sortedResults).toEqual([]);
    });
  });

  describe('transform patient insurance params to patient insurance record', () => {
    it('transform patient insurance params into patient insurance record', async () => {
      const transformedResult =
        grpcMapper.PatientInsuranceParamsToGrpcPatientInsuranceRecord({
          input: INSURANCE_PARAMS_MOCK,
          patientId: '1',
          insuranceId: '1',
        });
      expect(transformedResult).toEqual(INSURANCE_RECORD_MOCK);
    });

    it('transforms patient insurance when patientId and memberId are undefined', async () => {
      const transformedResult =
        grpcMapper.PatientInsuranceParamsToGrpcPatientInsuranceRecord({
          input: {
            ...INSURANCE_PARAMS_MOCK,
            memberId: undefined,
          },
          patientId: undefined,
          insuranceId: undefined,
        });
      expect(transformedResult.patient_id).toBeUndefined();
      expect(transformedResult.member_id).toBeUndefined();
      expect(transformedResult.id).toBeUndefined();
    });
  });

  describe('transform patient insurance parts', () => {
    it.each([
      ['1', InsurancePriority.INSURANCE_PRIORITY_PRIMARY],
      ['2', InsurancePriority.INSURANCE_PRIORITY_SECONDARY],
      ['3', InsurancePriority.INSURANCE_PRIORITY_TERTIARY],
      ['', InsurancePriority.INSURANCE_PRIORITY_UNSPECIFIED],
    ])('transforms insurance priority %s', async (input, expected) => {
      const result = grpcMapper.InsurancePriorityToGrpcInsurancePriority(input);
      expect(result).toEqual(expected);
    });

    it.each(PatientRelationshipToGrpcInsuredToPatientRelationData)(
      'transforms patient relationship "%s" to insured to patient relation',
      async (input, expected) => {
        const result =
          grpcMapper.PatientRelationshipToGrpcInsuredToPatientRelation(
            input as string
          );
        expect(result).toEqual(expected);
      }
    );

    it.each([
      ['unspecified', EligibilityStatus.ELIGIBILITY_STATUS_UNSPECIFIED],
      ['eligible', EligibilityStatus.ELIGIBILITY_STATUS_ELIGIBLE],
      ['ineligible', EligibilityStatus.ELIGIBILITY_STATUS_INELIGIBLE],
      ['unverified', EligibilityStatus.ELIGIBILITY_STATUS_UNVERIFIED],
      ['', EligibilityStatus.ELIGIBILITY_STATUS_UNSPECIFIED],
      [undefined, EligibilityStatus.ELIGIBILITY_STATUS_UNSPECIFIED],
    ])(
      'transform insurance eligibility %s to %s',
      async (input, expectedOutput) => {
        const transformedEligibility =
          grpcMapper.InsuranceEligibilityStatusToGrpcEligibilityStatus(input);
        expect(transformedEligibility).toEqual(expectedOutput);
      }
    );

    it.each([
      [
        'unspecified',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED,
      ],
      [
        'patient',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_PATIENT,
      ],
      [
        'mother',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_MOTHER,
      ],
      [
        'father',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FATHER,
      ],
      [
        'child',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_CHILD,
      ],
      [
        'spouse',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE,
      ],
      [
        'friend',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FRIEND,
      ],
      [
        'other',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_OTHER,
      ],
      [
        '',
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED,
      ],
    ])(
      'transform patient relationship to subscriber',
      async (input, expectedOutput) => {
        const transformed =
          grpcMapper.PatientRelationshipToSubscriberToGrpcPatientRelationToSubscriber(
            input
          );
        expect(transformed).toEqual(expectedOutput);
      }
    );
  });

  describe('transform patient insurance params to patient insurance record', () => {
    it('transform patient insurance params into patient insurance record', async () => {
      const transformedResult =
        grpcMapper.GrpcPatientInsuranceRecordToPatientInsurance({
          ...INSURANCE_RECORD_MOCK,
          id: '1',
          group_id: '56789',
          updated_at: {
            seconds: Math.floor(
              new Date('2023-07-07T12:34:56.123Z').getTime() / 1000
            ),
            nanos: 123000000,
          },
        });
      expect(transformedResult).toEqual(PATIENT_INSURANCE_MOCK);
    });

    it('transform patient insurance params into patient insurance record if input is null', async () => {
      expect(() =>
        grpcMapper.GrpcPatientInsuranceRecordToPatientInsurance(null)
      ).toThrowError(
        'GrpcPatientInsuranceRecordToPatientInsurance: input is not specified'
      );
    });
  });

  describe('transform patient insurance record parts', () => {
    it.each([
      [InsurancePriority.INSURANCE_PRIORITY_PRIMARY, '1'],
      [InsurancePriority.INSURANCE_PRIORITY_SECONDARY, '2'],
      [InsurancePriority.INSURANCE_PRIORITY_TERTIARY, '3'],
      [InsurancePriority.INSURANCE_PRIORITY_UNSPECIFIED, 'unspecified'],
    ])(
      'transform patient insurance record priority',
      async (input, expectedOutput) => {
        const transformed =
          grpcMapper.GrpcInsurancePriorityToInsurancePriority(input);
        expect(transformed).toEqual(expectedOutput);
      }
    );

    it.each([
      [EligibilityStatus.ELIGIBILITY_STATUS_UNSPECIFIED, 'unspecified'],
      [EligibilityStatus.ELIGIBILITY_STATUS_ELIGIBLE, 'eligible'],
      [EligibilityStatus.ELIGIBILITY_STATUS_INELIGIBLE, 'ineligible'],
      [EligibilityStatus.ELIGIBILITY_STATUS_UNVERIFIED, 'unverified'],
    ])(
      'transform insurance record eligibility %s to %s',
      async (eligibilityStatus, expectedStatus) => {
        const transformedInsuranceRecordEligibility =
          grpcMapper.EligibilityStatusToEligible(eligibilityStatus);

        expect(transformedInsuranceRecordEligibility).toEqual(expectedStatus);
      }
    );

    it.each([
      [
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_PATIENT,
        'patient',
      ],
      [
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_MOTHER,
        'mother',
      ],
      [
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FATHER,
        'father',
      ],
      [
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_CHILD,
        'child',
      ],
      [
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE,
        'spouse',
      ],
      [
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FRIEND,
        'friend',
      ],
      [
        PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_OTHER,
        'other',
      ],
      [PatientRelationToSubscriber.UNRECOGNIZED, 'unrecognized'],
    ])(
      'transform patient insurance record relationship to subscriber %p to %p',
      async (input, expected) => {
        const result =
          grpcMapper.PatientRelationToPatientRelationToSubscriber(input);
        expect(result).toEqual(expected);
      }
    );
  });

  describe('Unverified patient', () => {
    it('should transform patient to grpc unverified patient', () => {
      const grpcUnverifiedPatient =
        mapper.UnverifiedPatientToGrpcUnverifiedPatient(
          UNVERIFIED_PATIENT_MOCK
        );
      expect(grpcUnverifiedPatient).toEqual(GRPC_UNVERIFIED_PATIENT_MOCK);
    });

    it('should transform patient to grpc unverified patient', () => {
      const grpcUnverifiedPatient =
        mapper.UnverifiedPatientToGrpcUnverifiedPatient({
          ...UNVERIFIED_PATIENT_MOCK,
          genderIdentity: GenderIdentityCategory.CATEGORY_MALE,
        });
      expect(grpcUnverifiedPatient).toEqual({
        ...GRPC_UNVERIFIED_PATIENT_MOCK,
        gender_identity: { category: GenderIdentity_Category.CATEGORY_MALE },
      });
    });

    it('should transform grpc unverified patient to unverified patient', () => {
      const grpcUnverifiedPatient =
        mapper.GrpcUnverifiedPatientToUnverifiedPatient(
          GRPC_UNVERIFIED_PATIENT_MOCK,
          new Uint8Array(8)
        );
      expect(grpcUnverifiedPatient).toEqual(UNVERIFIED_PATIENT_MOCK);
    });
  });

  describe('onboardingBirthSex', () => {
    it.each([
      {
        input: ProtoBirthSex.BIRTH_SEX_MALE,
        expected: BirthSex.BIRTH_SEX_MALE,
      },
      {
        input: ProtoBirthSex.BIRTH_SEX_FEMALE,
        expected: BirthSex.BIRTH_SEX_FEMALE,
      },
      {
        input: ProtoBirthSex.BIRTH_SEX_UNDISCLOSED,
        expected: BirthSex.BIRTH_SEX_UNDISCLOSED,
      },
      {
        input: ProtoBirthSex.BIRTH_SEX_UNKNOWN,
        expected: BirthSex.BIRTH_SEX_UNKNOWN,
      },
      {
        input: -27 as never,
        expected: undefined,
      },
      {
        input: undefined,
        expected: undefined,
      },
    ])('should work for $input', ({ input, expected }) => {
      expect(onboardingBirthSex(input)).toBe(expected);
    });
  });

  describe('protoBirthSex', () => {
    it.each([
      {
        input: BirthSex.BIRTH_SEX_MALE,
        expected: ProtoBirthSex.BIRTH_SEX_MALE,
      },
      {
        input: BirthSex.BIRTH_SEX_FEMALE,
        expected: ProtoBirthSex.BIRTH_SEX_FEMALE,
      },
      {
        input: BirthSex.BIRTH_SEX_UNDISCLOSED,
        expected: ProtoBirthSex.BIRTH_SEX_UNDISCLOSED,
      },
      {
        input: BirthSex.BIRTH_SEX_UNKNOWN,
        expected: ProtoBirthSex.BIRTH_SEX_UNKNOWN,
      },
      {
        input: -27 as never,
        expected: undefined,
      },
      {
        input: undefined,
        expected: undefined,
      },
    ])('should work for $input', ({ input, expected }) => {
      expect(protoBirthSex(input)).toBe(expected);
    });
  });

  describe('protoPatientSafetyFlag', () => {
    it.each([
      {
        input: 'permanent',
        expected: PatientSafetyFlag_FlagType.FLAG_TYPE_PERMANENT,
      },
      {
        input: 'temporary',
        expected: PatientSafetyFlag_FlagType.FLAG_TYPE_TEMPORARY,
      },
      {
        input: 'unspecified',
        expected: PatientSafetyFlag_FlagType.FLAG_TYPE_UNSPECIFIED,
      },
      {
        input: undefined,
        expected: PatientSafetyFlag_FlagType.UNRECOGNIZED,
      },
    ])('should work for $input', ({ input, expected }) => {
      expect(protoPatientSafetyFlag(input)).toBe(expected);
    });
  });

  describe('onboardingPatientSafetyFlag', () => {
    it.each([
      {
        input: PatientSafetyFlag_FlagType.FLAG_TYPE_PERMANENT,
        expected: 'permanent',
      },
      {
        input: PatientSafetyFlag_FlagType.FLAG_TYPE_TEMPORARY,
        expected: 'temporary',
      },
      {
        input: PatientSafetyFlag_FlagType.FLAG_TYPE_UNSPECIFIED,
        expected: 'unspecified',
      },
      {
        input: undefined,
        expected: 'unrecognized',
      },
    ])('should work for $input', ({ input, expected }) => {
      expect(onboardingPatientSafetyFlag(input)).toBe(expected);
    });
  });
});
