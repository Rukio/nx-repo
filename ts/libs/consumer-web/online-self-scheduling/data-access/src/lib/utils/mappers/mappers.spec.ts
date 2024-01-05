import {
  prepareInsuranceParams,
  preparePatientAccountAddressRequestData,
  prepareUpdatePatientAddressRequestData,
  prepareUpdatePatientDemographicsRequestData,
  toConsentingRelationshipCategory,
  toGenderIdentityCategory,
  transformDomainPatientAddressTo,
  transformDomainPatientAddressesTo,
  transformAddressParts,
  transformAddressDataToPatientAddress,
  toFormattedAddress,
  transformNetworksToPayers,
  transformPayerWithClassificationName,
  prepareUpdatePOARequestData,
  toSeparatedSymptomsString,
  SYMPTOMS_DIVIDER,
  prepareCreateSelfSchedulingCareRequestPayload,
  toBirthSex,
  toFacilityType,
  toFacilityTypeName,
} from './mappers';
import {
  mockPatientAccount,
  mockPatientAddress,
  mockPatientAccountAddressData,
  mockCreatePatientAccountAddressPayload,
  mockUpdatePatientAccountAddressPayload,
  mockInsuranceParams,
  mockCheckInsuranceEligibilityPayload,
  mockedInsuranceClassifications,
  mockCreatePatientAccountUnverifiedPatientPayload,
  mockUpdatePatientAccountPayload,
  mockDomainPatientAccountAddress,
  mockedInsuranceNetworksList,
  mockedPayersWithClassifications,
  mockedPayersFromNetwork,
  mockedPayersWithEmptyClassifications,
  CreatePatientAccountAddressPayload,
  mockPatientAccountVerifiedPatient,
  mockPatientAccountUnverifiedPatient,
  mockRiskStratificationProtocol,
  mockSelfScheduleData,
  mockChannelItem,
} from '../../domain';
import {
  mockUpdatePatientDemographicsPayload,
  mockCachePatientPOAPayload,
  CachePatientPOAPayload,
} from '../../feature';
import {
  AssignedSexAtBirth,
  GenderIdentity,
  InsurancePriority,
  FacilityTypeName,
  RelationToPatient,
  PatientAddress,
} from '../../types';
import {
  BirthSex,
  ConsentingRelationshipCategory,
  FacilityType,
  GenderIdentityCategory,
} from '@*company-data-covered*/consumer-web-types';

describe('utils mappers', () => {
  describe('preparePatientAccountAddressRequestData', () => {
    it('should transform patient account address data to save patient account address payload', () => {
      const result = preparePatientAccountAddressRequestData(
        mockPatientAccount.id,
        mockPatientAccountAddressData
      );
      expect(result).toEqual(mockCreatePatientAccountAddressPayload);
    });

    it('should transform empty address data to save patient account address payload', () => {
      const expectedResult: CreatePatientAccountAddressPayload = {
        accountId: mockPatientAccount.id,
        city: '',
        state: '',
        zip: '',
        streetAddress1: '',
        streetAddress2: '',
        additionalDetails: '',
        facilityType: FacilityType.FACILITY_TYPE_UNSPECIFIED,
      };

      const result = preparePatientAccountAddressRequestData(
        mockPatientAccount.id,
        {}
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('prepareUpdatePatientAddressRequestData', () => {
    it('should transform patient account address data to update patient address payload', () => {
      const result = prepareUpdatePatientAddressRequestData({
        accountId: 1,
        addressId: 1,
        consistencyToken: new Uint8Array(8).toString(),
        address: mockPatientAccountAddressData,
      });
      expect(result).toEqual(mockUpdatePatientAccountAddressPayload);
    });
  });

  describe('prepareInsuranceParams', () => {
    const { patient, selectedNetwork } = mockCheckInsuranceEligibilityPayload;
    const mockMemberId = '123';

    it.each([
      {
        input: {
          memberId: mockMemberId,
          isRequesterRelationshipSelf: true,
          patient,
          selectedNetwork,
        },
        expected: mockInsuranceParams,
      },
      {
        input: {
          memberId: mockMemberId,
          isRequesterRelationshipSelf: true,
          patient,
          selectedNetwork,
          insurancePriority: InsurancePriority.PRIMARY,
        },
        expected: {
          ...mockInsuranceParams,
          priority: InsurancePriority.PRIMARY,
        },
      },
      {
        input: {
          memberId: mockMemberId,
          isRequesterRelationshipSelf: true,
          patient,
          selectedNetwork,
          insurancePriority: InsurancePriority.SECONDARY,
        },
        expected: {
          ...mockInsuranceParams,
          priority: InsurancePriority.SECONDARY,
        },
      },
      {
        input: {
          memberId: mockMemberId,
          isRequesterRelationshipSelf: false,
          patient,
          selectedNetwork,
        },
        expected: {
          ...mockInsuranceParams,
          primaryInsuranceHolderToggle: RelationToPatient.Other,
          patientRelationToSubscriber: RelationToPatient.Other,
          patientRelationshipToInsured: RelationToPatient.Other,
          primaryInsuranceHolderAttributes: {
            ...mockInsuranceParams.primaryInsuranceHolderAttributes,
            patientRelationshipToInsured: RelationToPatient.Other,
          },
        },
      },
    ])(
      'should transform provided data to insurance params',
      ({ input, expected }) => {
        expect(prepareInsuranceParams(input)).toEqual(expected);
      }
    );
  });

  describe('prepareUpdatePatientDemographicsRequestData', () => {
    it('should transform patient account address data to save patient account address payload', () => {
      const result = prepareUpdatePatientDemographicsRequestData(
        mockUpdatePatientDemographicsPayload
      );
      expect(result).toEqual({
        account: {
          firstName: mockUpdatePatientAccountPayload.firstName,
          lastName: mockUpdatePatientAccountPayload.lastName,
          phone: mockUpdatePatientAccountPayload.phone,
        },
        patient: {
          dateOfBirth:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .dateOfBirth,
          givenName:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .givenName,
          legalSex:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .legalSex,
          birthSex:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .birthSex,
          genderIdentity:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .genderIdentity,
          genderIdentityDetails:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .genderIdentityDetails,
          familyName:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .familyName,
          middleName: mockPatientAccountVerifiedPatient.middleName,
          phoneNumber:
            mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
              .phoneNumber,
          suffix: mockPatientAccountVerifiedPatient.suffix,
        },
      });
    });
  });

  describe('transformAddressParts', () => {
    it.each([
      {
        input: ['Street 1', 'Street part 2'],
        expected: 'Street 1, Street part 2',
      },
      {
        input: ['Street 1', 'Street part 2'],
        separator: ' - ',
        expected: 'Street 1 - Street part 2',
      },
      {
        input: ['Street 1', undefined],
        separator: ' - ',
        expected: 'Street 1',
      },
      {
        input: [undefined, undefined],
        separator: ' - ',
        expected: '',
      },
    ])('should build address url', ({ input, separator, expected }) => {
      expect(transformAddressParts(input, separator)).toEqual(expected);
    });
  });

  describe('toFormattedAddress', () => {
    it.each([
      {
        input: mockDomainPatientAccountAddress,
        expected: `${mockDomainPatientAccountAddress.streetAddress1}, ${mockDomainPatientAccountAddress.streetAddress2} ${mockDomainPatientAccountAddress.city}, ${mockDomainPatientAccountAddress.state} ${mockDomainPatientAccountAddress.zip}`,
      },
      {
        input: null,
        expected: '',
      },
    ])('should build formatted address for $input', ({ input, expected }) => {
      expect(toFormattedAddress(input)).toEqual(expected);
    });
  });

  describe('toBirthSex', () => {
    it.each([
      {
        value: AssignedSexAtBirth.Male,
        expected: BirthSex.BIRTH_SEX_MALE,
      },
      {
        value: AssignedSexAtBirth.Female,
        expected: BirthSex.BIRTH_SEX_FEMALE,
      },
      {
        value: AssignedSexAtBirth.ChooseNotToDisclose,
        expected: BirthSex.BIRTH_SEX_UNDISCLOSED,
      },
      {
        value: AssignedSexAtBirth.Unknown,
        expected: BirthSex.BIRTH_SEX_UNKNOWN,
      },
      {
        value: undefined,
        expected: BirthSex.BIRTH_SEX_UNSPECIFIED,
      },
      {
        value: 'test',
        expected: BirthSex.UNRECOGNIZED,
      },
    ])(
      'should transform AssignedSexAtBirth enum to BirthSex for $value',
      ({ value, expected }) => {
        const result = toBirthSex(value);
        expect(result).toEqual(expected);
      }
    );
  });

  describe('toGenderIdentityCategory', () => {
    it.each([
      {
        value: GenderIdentity.Male,
        expected: GenderIdentityCategory.CATEGORY_MALE,
      },
      {
        value: GenderIdentity.Female,
        expected: GenderIdentityCategory.CATEGORY_FEMALE,
      },
      {
        value: GenderIdentity.MaleToFemale,
        expected: GenderIdentityCategory.CATEGORY_MALE_TO_FEMALE,
      },
      {
        value: GenderIdentity.FemaleToMale,
        expected: GenderIdentityCategory.CATEGORY_FEMALE_TO_MALE,
      },
      {
        value: GenderIdentity.NonBinary,
        expected: GenderIdentityCategory.CATEGORY_NON_BINARY,
      },
      {
        value: GenderIdentity.Other,
        expected: GenderIdentityCategory.CATEGORY_OTHER,
      },
      {
        value: GenderIdentity.Unknown,
        expected: GenderIdentityCategory.CATEGORY_UNDISCLOSED,
      },
      {
        value: undefined,
        expected: GenderIdentityCategory.CATEGORY_UNSPECIFIED,
      },
      {
        value: 'test',
        expected: GenderIdentityCategory.UNRECOGNIZED,
      },
    ])(
      'should transform GenderIdentity enum to GenderIdentityCategory for $value',
      ({ value, expected }) => {
        const result = toGenderIdentityCategory(value);
        expect(result).toEqual(expected);
      }
    );
  });

  describe('toConsentingRelationshipCategory', () => {
    it.each([
      {
        value: RelationToPatient.Patient,
        expected: ConsentingRelationshipCategory.CATEGORY_SELF,
      },
      {
        value: RelationToPatient.FamilyFriend,
        expected: ConsentingRelationshipCategory.CATEGORY_FAMILY_FRIEND,
      },
      {
        value: RelationToPatient.Clinician,
        expected:
          ConsentingRelationshipCategory.CATEGORY_CLINICIAN_ORGANIZATION,
      },
      {
        value: RelationToPatient.Other,
        expected: ConsentingRelationshipCategory.CATEGORY_OTHER,
      },
      {
        value: undefined,
        expected: ConsentingRelationshipCategory.CATEGORY_UNSPECIFIED,
      },
    ])(
      'should transform RelationToPatient enum to ConsentingRelationshipCategory for $value',
      ({ value, expected }) => {
        const result = toConsentingRelationshipCategory(value);
        expect(result).toEqual(expected);
      }
    );
  });

  describe('transformDomainPatientAddressTo', () => {
    it('should transform domain patient address', () => {
      const result = transformDomainPatientAddressTo(
        mockDomainPatientAccountAddress
      );
      expect(result).toEqual({
        value: String(mockDomainPatientAccountAddress.id),
        zip: mockDomainPatientAccountAddress.zip,
        label: transformAddressParts([
          mockDomainPatientAccountAddress.streetAddress1,
          transformAddressParts(
            [
              mockDomainPatientAccountAddress.streetAddress2,
              mockDomainPatientAccountAddress.city,
            ],
            ' '
          ),
          transformAddressParts(
            [
              mockDomainPatientAccountAddress.state,
              mockDomainPatientAccountAddress.zip,
            ],
            ' '
          ),
        ]),
      });
    });
  });

  describe('transformDomainPatientAddressesTo', () => {
    it('should transform domain patient address', () => {
      const result = transformDomainPatientAddressesTo([
        mockDomainPatientAccountAddress,
      ]);
      expect(result).toEqual([
        {
          value: String(mockDomainPatientAccountAddress.id),
          zip: mockDomainPatientAccountAddress.zip,
          label: transformAddressParts([
            mockDomainPatientAccountAddress.streetAddress1,
            transformAddressParts(
              [
                mockDomainPatientAccountAddress.streetAddress2,
                mockDomainPatientAccountAddress.city,
              ],
              ' '
            ),
            transformAddressParts(
              [
                mockDomainPatientAccountAddress.state,
                mockDomainPatientAccountAddress.zip,
              ],
              ' '
            ),
          ]),
        },
      ]);
    });
  });

  describe('transformAddressDataToPatientAddress', () => {
    it.each([
      {
        name: 'address data',
        input: mockPatientAccountAddressData,
        expected: mockPatientAddress,
      },
      {
        name: 'empty address data',
        input: {},
        expected: {
          city: '',
          state: '',
          zip: '',
          streetAddress1: '',
          streetAddress2: '',
          additionalDetails: '',
        },
      },
      {
        name: 'undefined address data',
        input: undefined,
        expected: {
          city: '',
          state: '',
          zip: '',
          streetAddress1: '',
          streetAddress2: '',
          additionalDetails: '',
        },
      },
    ])('should transform $name to patient address', ({ input, expected }) => {
      const result = transformAddressDataToPatientAddress(input);
      expect(result).toEqual(expected);
    });

    it('should transform empty address data to patient address', () => {
      const expectedResult: PatientAddress = {
        city: '',
        state: '',
        zip: '',
        streetAddress1: '',
        streetAddress2: '',
        additionalDetails: '',
      };

      const result = transformAddressDataToPatientAddress({});

      expect(result).toEqual(expectedResult);
    });
  });

  describe('transformNetworksToPayers', () => {
    it('should transform networks to payers', () => {
      const result = transformNetworksToPayers(mockedInsuranceNetworksList);

      expect(result).toEqual([
        {
          id: '1',
          name: 'Awesome Payer',
          classificationId: '1',
          stateAbbrs: ['AS1'],
        },
      ]);
    });

    it('should return an empty array if no networks provided', () => {
      const result = transformNetworksToPayers();

      expect(result).toEqual([]);
    });
  });

  describe('transformPayerWithClassificationName', () => {
    it('should transform payer with classification name', () => {
      const result = transformPayerWithClassificationName(
        mockedPayersFromNetwork,
        mockedInsuranceClassifications
      );

      expect(result).toEqual(mockedPayersWithClassifications);
    });

    it('should return an array with empty classificationName if no classifications found', () => {
      const result = transformPayerWithClassificationName(
        mockedPayersFromNetwork
      );

      expect(result).toEqual(mockedPayersWithEmptyClassifications);
    });

    it('should return an empty array if no payers provided', () => {
      const result = transformPayerWithClassificationName();

      expect(result).toEqual([]);
    });
  });

  describe('prepareUpdatePOARequestData', () => {
    it('generates POA form data for patient decision maker with patient data', () => {
      const result = prepareUpdatePOARequestData(
        mockCachePatientPOAPayload,
        mockPatientAccount
      );

      const { firstName, lastName, phone } = mockPatientAccount;

      expect(result).toEqual({
        name: `${firstName} ${lastName}`,
        phone: phone,
        relationship: RelationToPatient.Patient,
      });
    });

    it('generates POA form data for non-patient decision maker', () => {
      const mockUpdatePOAPayloadWithNonPatientDecisionMaker: CachePatientPOAPayload =
        {
          ...mockCachePatientPOAPayload,
          isPatientDecisionMaker: false,
        };

      const result = prepareUpdatePOARequestData(
        mockUpdatePOAPayloadWithNonPatientDecisionMaker,
        mockPatientAccount
      );

      const { firstName, lastName, phoneNumber } =
        mockUpdatePOAPayloadWithNonPatientDecisionMaker;

      expect(result).toEqual({
        name: `${firstName} ${lastName}`,
        phone: phoneNumber,
        relationship: RelationToPatient.Other,
      });
    });

    it('generates POA form data for patient decision maker with unverified patient data', () => {
      const result = prepareUpdatePOARequestData(
        mockCachePatientPOAPayload,
        mockPatientAccountUnverifiedPatient
      );
      const { givenName, familyName, phoneNumber } =
        mockPatientAccountUnverifiedPatient;

      expect(result).toEqual({
        name: `${givenName} ${familyName}`,
        phone: phoneNumber,
        relationship: RelationToPatient.Patient,
      });
    });

    it('generates POA form data for non-patient decision maker with unverified patient data', () => {
      const mockUpdatePOAPayloadWithNonPatientDecisionMaker: CachePatientPOAPayload =
        {
          ...mockCachePatientPOAPayload,
          isPatientDecisionMaker: false,
        };

      const result = prepareUpdatePOARequestData(
        mockUpdatePOAPayloadWithNonPatientDecisionMaker,
        mockPatientAccountUnverifiedPatient
      );

      const { firstName, lastName, phoneNumber } =
        mockUpdatePOAPayloadWithNonPatientDecisionMaker;

      expect(result).toEqual({
        name: `${firstName} ${lastName}`,
        phone: phoneNumber,
        relationship: RelationToPatient.Other,
      });
    });
  });

  describe('toSeparatedSymptomsString', () => {
    it.each([
      { input: 'cough', expected: 'cough' },
      { input: ' cough ', expected: 'cough' },
      {
        input: 'cough, back pain, eye pain',
        expected: `cough${SYMPTOMS_DIVIDER}back pain${SYMPTOMS_DIVIDER}eye pain`,
      },
    ])('should return correct result', ({ input, expected }) => {
      const result = toSeparatedSymptomsString(input);
      expect(result).toBe(expected);
    });
  });

  describe('prepareCreateSelfSchedulingCareRequestPayload', () => {
    it.each([
      {
        input: {
          powerOfAttorneyId: '1',
          unverifiedPatient: mockPatientAccountUnverifiedPatient,
          riskStratificationProtocol: mockRiskStratificationProtocol,
          selfScheduleData: mockSelfScheduleData,
          patientAddress: mockDomainPatientAccountAddress,
          patientAccount: mockPatientAccount,
          channelItem: mockChannelItem,
          isRequesterRelationshipSelf: false,
        },
        expected: {
          careRequest: {
            address: {
              additionalDetails: 'Parking is behind the building',
              city: mockDomainPatientAccountAddress.city,
              state: mockDomainPatientAccountAddress.state,
              streetAddress1: mockDomainPatientAccountAddress.streetAddress1,
              streetAddress2: mockDomainPatientAccountAddress.streetAddress2,
              zip: mockDomainPatientAccountAddress.zip,
            },
            channelItemId: mockChannelItem.id,
            complaint: {
              symptoms: mockSelfScheduleData.symptoms,
            },
            marketId: mockSelfScheduleData.marketId,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
            patientPreferredEta: {
              patientPreferredEtaEnd: '2023-07-05T21:00:00.000Z',
              patientPreferredEtaStart: '2023-07-05T16:00:00.000Z',
            },
            placeOfService: FacilityTypeName.Home,
            requester: {
              firstName: mockPatientAccount.firstName,
              lastName: mockPatientAccount.lastName,
              phone: mockPatientAccount.phone,
              relationToPatient:
                mockSelfScheduleData.requester.relationToPatient,
              organizationName: mockChannelItem.name,
            },
          },
          mpoaConsent: {
            powerOfAttorneyId: 1,
          },
        },
      },
      {
        input: {
          powerOfAttorneyId: '1',
          unverifiedPatient: mockPatientAccountUnverifiedPatient,
          riskStratificationProtocol: mockRiskStratificationProtocol,
          selfScheduleData: mockSelfScheduleData,
          patientAddress: mockDomainPatientAccountAddress,
          patientAccount: mockPatientAccount,
          channelItem: mockChannelItem,
          isRiskAssessmentRequired: true,
          isRequesterRelationshipSelf: false,
        },
        expected: {
          careRequest: {
            address: {
              additionalDetails: 'Parking is behind the building',
              city: mockDomainPatientAccountAddress.city,
              state: mockDomainPatientAccountAddress.state,
              streetAddress1: mockDomainPatientAccountAddress.streetAddress1,
              streetAddress2: mockDomainPatientAccountAddress.streetAddress2,
              zip: mockDomainPatientAccountAddress.zip,
            },
            channelItemId: mockChannelItem.id,
            complaint: {
              symptoms: mockSelfScheduleData.symptoms,
            },
            marketId: mockSelfScheduleData.marketId,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
            patientPreferredEta: {
              patientPreferredEtaEnd: '2023-07-05T21:00:00.000Z',
              patientPreferredEtaStart: '2023-07-05T16:00:00.000Z',
            },
            placeOfService: FacilityTypeName.Home,
            requester: {
              firstName: mockPatientAccount.firstName,
              lastName: mockPatientAccount.lastName,
              phone: mockPatientAccount.phone,
              relationToPatient:
                mockSelfScheduleData.requester.relationToPatient,
              organizationName: mockChannelItem.name,
            },
          },
          mpoaConsent: {
            powerOfAttorneyId: 1,
          },
          riskAssessment: {
            dob: mockPatientAccountUnverifiedPatient.dateOfBirth,
            gender: mockPatientAccountUnverifiedPatient.legalSex,
            worstCaseScore: 0,
            score: 0,
            protocolId: +mockRiskStratificationProtocol.id,
            protocolName: mockRiskStratificationProtocol.name,
            overrideReason: '',
            complaint: {
              symptom: mockSelfScheduleData.symptoms,
              selectedSymptoms: mockSelfScheduleData.symptoms,
            },
            responses: {
              questions: mockRiskStratificationProtocol.questions,
            },
          },
        },
      },
      {
        input: {
          powerOfAttorneyId: '1',
          unverifiedPatient: mockPatientAccountUnverifiedPatient,
          riskStratificationProtocol: mockRiskStratificationProtocol,
          selfScheduleData: mockSelfScheduleData,
          patientAddress: mockDomainPatientAccountAddress,
          patientAccount: mockPatientAccount,
          channelItem: mockChannelItem,
          riskAssessmentScore: 10,
          isRiskAssessmentRequired: true,
          isRequesterRelationshipSelf: false,
        },
        expected: {
          careRequest: {
            address: {
              additionalDetails: 'Parking is behind the building',
              city: mockDomainPatientAccountAddress.city,
              state: mockDomainPatientAccountAddress.state,
              streetAddress1: mockDomainPatientAccountAddress.streetAddress1,
              streetAddress2: mockDomainPatientAccountAddress.streetAddress2,
              zip: mockDomainPatientAccountAddress.zip,
            },
            channelItemId: mockChannelItem.id,
            complaint: {
              symptoms: mockSelfScheduleData.symptoms,
            },
            marketId: mockSelfScheduleData.marketId,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
            patientPreferredEta: {
              patientPreferredEtaEnd: '2023-07-05T21:00:00.000Z',
              patientPreferredEtaStart: '2023-07-05T16:00:00.000Z',
            },
            placeOfService: FacilityTypeName.Home,
            requester: {
              firstName: mockPatientAccount.firstName,
              lastName: mockPatientAccount.lastName,
              phone: mockPatientAccount.phone,
              relationToPatient:
                mockSelfScheduleData.requester.relationToPatient,
              organizationName: mockChannelItem.name,
            },
          },
          mpoaConsent: {
            powerOfAttorneyId: 1,
          },
          riskAssessment: {
            dob: mockPatientAccountUnverifiedPatient.dateOfBirth,
            gender: mockPatientAccountUnverifiedPatient.legalSex,
            worstCaseScore: 10,
            score: 10,
            protocolId: +mockRiskStratificationProtocol.id,
            protocolName: mockRiskStratificationProtocol.name,
            overrideReason: '',
            complaint: {
              symptom: mockSelfScheduleData.symptoms,
              selectedSymptoms: mockSelfScheduleData.symptoms,
            },
            responses: {
              questions: mockRiskStratificationProtocol.questions,
            },
          },
        },
      },
      {
        input: {
          powerOfAttorneyId: '1',
          unverifiedPatient: mockPatientAccountUnverifiedPatient,
          riskStratificationProtocol: mockRiskStratificationProtocol,
          selfScheduleData: {
            ...mockSelfScheduleData,
            preferredEta: undefined,
          },
          patientAccount: mockPatientAccount,
          patientAddress: mockDomainPatientAccountAddress,
          channelItem: mockChannelItem,
          isRequesterRelationshipSelf: false,
        },
        expected: {
          careRequest: {
            address: {
              additionalDetails: 'Parking is behind the building',
              city: mockDomainPatientAccountAddress.city,
              state: mockDomainPatientAccountAddress.state,
              streetAddress1: mockDomainPatientAccountAddress.streetAddress1,
              streetAddress2: mockDomainPatientAccountAddress.streetAddress2,
              zip: mockDomainPatientAccountAddress.zip,
            },
            channelItemId: mockChannelItem.id,
            complaint: {
              symptoms: mockSelfScheduleData.symptoms,
            },
            marketId: mockSelfScheduleData.marketId,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
            placeOfService: FacilityTypeName.Home,
            requester: {
              firstName: mockPatientAccount.firstName,
              lastName: mockPatientAccount.lastName,
              phone: mockPatientAccount.phone,
              relationToPatient:
                mockSelfScheduleData.requester.relationToPatient,
              organizationName: mockChannelItem.name,
            },
          },
          mpoaConsent: {
            powerOfAttorneyId: 1,
          },
        },
      },
      {
        input: {
          powerOfAttorneyId: '1',
          unverifiedPatient: mockPatientAccountUnverifiedPatient,
          riskStratificationProtocol: mockRiskStratificationProtocol,
          selfScheduleData: mockSelfScheduleData,
          patientAddress: mockDomainPatientAccountAddress,
          patientAccount: mockPatientAccount,
          channelItem: mockChannelItem,
          isRequesterRelationshipSelf: true,
        },
        expected: {
          careRequest: {
            address: {
              additionalDetails: 'Parking is behind the building',
              city: mockDomainPatientAccountAddress.city,
              state: mockDomainPatientAccountAddress.state,
              streetAddress1: mockDomainPatientAccountAddress.streetAddress1,
              streetAddress2: mockDomainPatientAccountAddress.streetAddress2,
              zip: mockDomainPatientAccountAddress.zip,
            },
            channelItemId: mockChannelItem.id,
            complaint: {
              symptoms: mockSelfScheduleData.symptoms,
            },
            marketId: mockSelfScheduleData.marketId,
            patientId: mockPatientAccountUnverifiedPatient.patientId,
            patientPreferredEta: {
              patientPreferredEtaEnd: '2023-07-05T21:00:00.000Z',
              patientPreferredEtaStart: '2023-07-05T16:00:00.000Z',
            },
            placeOfService: FacilityTypeName.Home,
            requester: {
              firstName: mockPatientAccountUnverifiedPatient.givenName,
              lastName: mockPatientAccountUnverifiedPatient.familyName,
              phone: mockPatientAccountUnverifiedPatient.phoneNumber,
              relationToPatient:
                mockSelfScheduleData.requester.relationToPatient,
              organizationName: mockChannelItem.name,
            },
          },
          mpoaConsent: {
            powerOfAttorneyId: 1,
          },
        },
      },
    ])('should return correct result', ({ input, expected }) => {
      const result = prepareCreateSelfSchedulingCareRequestPayload(input);
      expect(result).toStrictEqual(expected);
    });
  });

  describe('toFacilityType', () => {
    it.each([
      {
        value: FacilityTypeName.Home,
        expected: FacilityType.FACILITY_TYPE_HOME,
      },
      {
        value: FacilityTypeName.IndependentLivingFacility,
        expected: FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY,
      },
      {
        value: FacilityTypeName.SeniorLivingTesting,
        expected: FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING,
      },
      {
        value: FacilityTypeName.AssistedLivingFacility,
        expected: FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY,
      },
      {
        value: FacilityTypeName.Clinic,
        expected: FacilityType.FACILITY_TYPE_CLINIC,
      },
      {
        value: FacilityTypeName.LongTermCareFacility,
        expected: FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY,
      },
      {
        value: FacilityTypeName.RehabilitationFacility,
        expected: FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY,
      },
      {
        value: FacilityTypeName.School,
        expected: FacilityType.FACILITY_TYPE_SCHOOL,
      },
      {
        value: FacilityTypeName.SkilledNursingFacility,
        expected: FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY,
      },
      {
        value: FacilityTypeName.VirtualVisit,
        expected: FacilityType.FACILITY_TYPE_VIRTUAL_VISIT,
      },
      {
        value: FacilityTypeName.Work,
        expected: FacilityType.FACILITY_TYPE_WORK,
      },
      {
        value: FacilityTypeName.Hotel,
        expected: FacilityType.FACILITY_TYPE_HOTEL,
      },
      {
        value: undefined,
        expected: FacilityType.FACILITY_TYPE_UNSPECIFIED,
      },
      {
        value: 'test',
        expected: FacilityType.UNRECOGNIZED,
      },
    ])(
      'should transform FacilityTypeName enum to FacilityType for $value',
      ({ value, expected }) => {
        const result = toFacilityType(value);
        expect(result).toEqual(expected);
      }
    );
  });

  describe('toFacilityTypeName', () => {
    it.each([
      {
        expected: FacilityTypeName.Home,
        value: FacilityType.FACILITY_TYPE_HOME,
      },
      {
        expected: FacilityTypeName.IndependentLivingFacility,
        value: FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY,
      },
      {
        expected: FacilityTypeName.SeniorLivingTesting,
        value: FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING,
      },
      {
        expected: FacilityTypeName.AssistedLivingFacility,
        value: FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY,
      },
      {
        expected: FacilityTypeName.Clinic,
        value: FacilityType.FACILITY_TYPE_CLINIC,
      },
      {
        expected: FacilityTypeName.LongTermCareFacility,
        value: FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY,
      },
      {
        expected: FacilityTypeName.RehabilitationFacility,
        value: FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY,
      },
      {
        expected: FacilityTypeName.School,
        value: FacilityType.FACILITY_TYPE_SCHOOL,
      },
      {
        expected: FacilityTypeName.SkilledNursingFacility,
        value: FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY,
      },
      {
        expected: FacilityTypeName.VirtualVisit,
        value: FacilityType.FACILITY_TYPE_VIRTUAL_VISIT,
      },
      {
        expected: FacilityTypeName.Work,
        value: FacilityType.FACILITY_TYPE_WORK,
      },
      {
        expected: FacilityTypeName.Hotel,
        value: FacilityType.FACILITY_TYPE_HOTEL,
      },
      {
        expected: undefined,
        value: FacilityType.FACILITY_TYPE_UNSPECIFIED,
      },
    ])(
      'should transform FacilityType enum to FacilityTypeName for $value',
      ({ value, expected }) => {
        const result = toFacilityTypeName(value);
        expect(result).toEqual(expected);
      }
    );
  });
});
