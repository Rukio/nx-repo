import {
  InsuranceNetworkPayer,
  InsuranceType,
  NetworkOption,
  QuestionYesNoAnswer,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  findMatchingPayer,
  getInsuranceEligibilityAlert,
  getNetworkOptions,
  getSearchNetworkFormFieldsValues,
  insuranceClassificationSchema,
  searchNetworkFormSchema,
} from './utils';
import {
  InsuranceEligibilityStatus,
  InsurancePriority,
  mockInsuranceWithEligibleStatus,
  mockedInsuranceNetworksList,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { networkPayersMock } from './mocks';

const mockSelectedPayerId = '1';
const mockPrimaryInsuranceNetwork =
  mockInsuranceWithEligibleStatus.insuranceNetwork;
const mockSecondaryInsurance: typeof mockInsuranceWithEligibleStatus = {
  ...mockInsuranceWithEligibleStatus,
  id: 2,
  priority: '2',
};
const mockSecondaryInsuranceNetwork = mockSecondaryInsurance.insuranceNetwork;
const mockNetworkOptions: NetworkOption[] = mockedInsuranceNetworksList.map(
  (network) => ({
    label: network.name,
    value: network.id.toString(),
  })
);
const mockPayer: InsuranceNetworkPayer = {
  ...networkPayersMock[0],
  name: 'Awesome Payer',
};

describe('utils', () => {
  describe('insuranceClassificationSchema', () => {
    it.each([
      {
        title: 'empty values',
        values: {
          insuranceType: '',
          isPublicInsuranceThroughCompany: '',
          stateAbbr: '',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: false,
      },
      {
        title: 'InsuranceType.EmployerProvidedOrPrivate',
        values: {
          insuranceType: InsuranceType.EmployerProvidedOrPrivate,
          isPublicInsuranceThroughCompany: '',
          stateAbbr: '',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: false,
      },
      {
        title: 'InsuranceType.Medicaid and valid data',
        values: {
          insuranceType: InsuranceType.Medicaid,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.No,
          stateAbbr: 'OH',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: true,
      },
      {
        title: 'InsuranceType.Medicaid and invalid data',
        values: {
          insuranceType: InsuranceType.Medicaid,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.No,
          stateAbbr: '',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: false,
      },
      {
        title: 'InsuranceType.Medicaid through company and valid data',
        values: {
          insuranceType: InsuranceType.Medicaid,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.Yes,
          stateAbbr: '',
          insurancePayerId: '1',
          insurancePayerName: 'Awesome Payer',
        },
        expectedResult: true,
      },
      {
        title: 'InsuranceType.Medicaid through company and invalid data',
        values: {
          insuranceType: InsuranceType.Medicaid,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.Yes,
          stateAbbr: '',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: false,
      },
      {
        title: 'InsuranceType.Medicare and valid data',
        values: {
          insuranceType: InsuranceType.Medicare,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.No,
          stateAbbr: 'OH',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: true,
      },
      {
        title: 'InsuranceType.Medicare and invalid data',
        values: {
          insuranceType: InsuranceType.Medicare,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.No,
          stateAbbr: '',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: false,
      },
      {
        title: 'InsuranceType.Medicare through company and valid data',
        values: {
          insuranceType: InsuranceType.Medicare,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.Yes,
          stateAbbr: '',
          insurancePayerId: '1',
          insurancePayerName: 'Awesome Payer',
        },
        expectedResult: true,
      },
      {
        title: 'InsuranceType.Medicare through company and invalid data',
        values: {
          insuranceType: InsuranceType.Medicare,
          isPublicInsuranceThroughCompany: QuestionYesNoAnswer.Yes,
          stateAbbr: '',
          insurancePayerId: '',
          insurancePayerName: '',
        },
        expectedResult: false,
      },
    ])(
      'should return $expectedResult as IsValid result with $title',
      async ({ values, expectedResult }) => {
        const isValid = await insuranceClassificationSchema.isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });

  describe('searchNetworkFormSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          payer: { id: '', label: '' },
          networkId: '',
          memberId: '',
        },
        expectedResult: false,
      },
      {
        name: 'correct insurancePayer and other empty values',
        values: {
          payer: {
            id: '1',
            label: 'Awesome Payer 1',
          },
          networkId: '',
          memberId: '',
        },
        expectedResult: false,
      },
      {
        name: 'correct insurancePayer and insuranceNetworkId (insuranceMemberId is empty)',
        values: {
          payer: {
            id: '1',
            label: 'Awesome Payer 1',
          },
          networkId: '1',
          memberId: '',
        },
        expectedResult: false,
      },
      {
        name: 'correct insurancePayer and insuranceMemberId (insuranceNetworkId is empty)',
        values: {
          payer: {
            id: '1',
            label: 'Awesome Payer 1',
          },
          networkId: '',
          memberId: '12345',
        },
        expectedResult: false,
      },
      {
        name: 'correct values',
        values: {
          payer: {
            id: '1',
            label: 'Awesome Payer 1',
          },
          networkId: '1',
          memberId: '12345',
        },
        expectedResult: true,
      },
    ])(
      'should return correct isValid result for $name',
      async ({ values, expectedResult }) => {
        const isValid = await searchNetworkFormSchema.isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });

  describe('findMatchingPayer', () => {
    const mockedMedicaidColoradoPayer: InsuranceNetworkPayer =
      networkPayersMock[0];

    it.each([
      {
        description: 'returns matching payer if found',
        publicInsurance: InsuranceType.Medicaid,
        stateAbbr: 'CO',
        expected: mockedMedicaidColoradoPayer,
      },
      {
        description: 'returns null if no matching payer is found',
        publicInsurance: InsuranceType.Medicare,
        stateAbbr: 'TX',
        expected: null,
      },
    ])('$description', ({ publicInsurance, stateAbbr, expected }) => {
      const result = findMatchingPayer(
        networkPayersMock,
        publicInsurance,
        stateAbbr
      );
      expect(result).toEqual(expected);
    });
  });

  describe('getInsuranceEligibilityAlert', () => {
    it.each([
      {
        alert: 'In Network alert',
        providedEligibility: `${InsuranceEligibilityStatus.Eligible} insurance`,
        insuranceEligibilityStatus: InsuranceEligibilityStatus.Eligible,
        isRequesterRelationshipSelf: true,
        relationship: 'self requester relationship',
        expectedResult: {
          severity: 'success',
          title: 'In Network',
          message: 'We’re in network with your insurance.',
        },
      },
      {
        alert: 'In Network alert',
        providedEligibility: `${InsuranceEligibilityStatus.Eligible} insurance`,
        insuranceEligibilityStatus: InsuranceEligibilityStatus.Eligible,
        isRequesterRelationshipSelf: false,
        relationship: 'someone else requester relationship',
        expectedResult: {
          severity: 'success',
          title: 'In Network',
          message: 'We’re in network with their insurance.',
        },
      },
      {
        alert: 'In Network alert',
        providedEligibility: `${InsuranceEligibilityStatus.Unverified} insurance`,
        insuranceEligibilityStatus: InsuranceEligibilityStatus.Unverified,
        isRequesterRelationshipSelf: true,
        relationship: 'self requester relationship',
        expectedResult: {
          severity: 'success',
          title: 'In Network',
          message: 'We’re in network with your insurance.',
        },
      },
      {
        alert: 'In Network alert',
        providedEligibility: `${InsuranceEligibilityStatus.Unverified} insurance`,
        insuranceEligibilityStatus: InsuranceEligibilityStatus.Unverified,
        isRequesterRelationshipSelf: false,
        relationship: 'someone else requester relationship',
        expectedResult: {
          severity: 'success',
          title: 'In Network',
          message: 'We’re in network with their insurance.',
        },
      },
      {
        alert: 'Out of Network alert',
        providedEligibility: `${InsuranceEligibilityStatus.Ineligible} insurance`,
        insuranceEligibilityStatus: InsuranceEligibilityStatus.Ineligible,
        isRequesterRelationshipSelf: true,
        relationship: 'self requester relationship',
        expectedResult: {
          severity: 'warning',
          title: 'Out of Network',
          message: 'It looks like your insurance is out of network.',
        },
      },
      {
        alert: 'Out of Network alert',
        providedEligibility: `${InsuranceEligibilityStatus.Ineligible} insurance`,
        insuranceEligibilityStatus: InsuranceEligibilityStatus.Ineligible,
        isRequesterRelationshipSelf: false,
        relationship: 'someone else requester relationship',
        expectedResult: {
          severity: 'warning',
          title: 'Out of Network',
          message:
            'It looks like the patient may be out of network. Please double check the information you provided is correct or that their insurance card is not expired.',
        },
      },
      {
        alert: 'undefined',
        providedEligibility: 'undefined eligibility status',
        insuranceEligibilityStatus: undefined,
        isRequesterRelationshipSelf: true,
        relationship: 'self requester relationship',
        expectedResult: undefined,
      },
    ])(
      'should return correct $alert for $providedEligibility and $relationship',
      ({
        insuranceEligibilityStatus,
        expectedResult,
        isRequesterRelationshipSelf,
      }) => {
        const result = getInsuranceEligibilityAlert(
          insuranceEligibilityStatus,
          isRequesterRelationshipSelf
        );
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe('getNetworkOptions', () => {
    it.each([
      {
        title:
          'correct network options with selected payerId if the patient does not have insurances',
        insuranceNetworks: mockedInsuranceNetworksList,
        hasInsuranceChanged: false,
        insurancePriority: InsurancePriority.PRIMARY,
        insurancePayerId: mockSelectedPayerId,
        primaryInsurance: null,
        secondaryInsurance: null,
        expectedResult: mockNetworkOptions,
      },
      {
        title:
          "correct network options with existing primary insurance payerId if the patient's primary insurance has changed",
        insuranceNetworks: mockedInsuranceNetworksList,
        hasInsuranceChanged: true,
        insurancePriority: InsurancePriority.PRIMARY,
        insurancePayerId: '',
        primaryInsurance: mockInsuranceWithEligibleStatus,
        secondaryInsurance: null,
        expectedResult: mockNetworkOptions,
      },
      {
        title:
          "correct network options with existing secondary insurance payerId if the patient's secondary insurance has changed",
        insuranceNetworks: mockedInsuranceNetworksList,
        hasInsuranceChanged: true,
        insurancePriority: InsurancePriority.SECONDARY,
        insurancePayerId: '',
        primaryInsurance: null,
        secondaryInsurance: mockSecondaryInsurance,
        expectedResult: mockNetworkOptions,
      },
    ])(
      'should return $title',
      ({
        insuranceNetworks,
        insurancePayerId,
        hasInsuranceChanged,
        insurancePriority,
        primaryInsurance,
        secondaryInsurance,
        expectedResult,
      }) => {
        const result = getNetworkOptions({
          insuranceNetworks,
          insurancePayerId,
          hasInsuranceChanged,
          insurancePriority,
          primaryInsurance,
          secondaryInsurance,
        });
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe('getSearchNetworkFormFieldsValues', () => {
    it.each([
      {
        title:
          'correct searchNetworkFormFieldValues with selected payer, networkId and memberId are empty strings if the patient does not have insurances',
        payers: [mockPayer],
        insurancePayerId: mockSelectedPayerId,
        networkOptions: mockNetworkOptions,
        hasInsuranceChanged: false,
        insurancePriority: InsurancePriority.PRIMARY,
        primaryInsurance: null,
        secondaryInsurance: null,
        expectedResult: {
          payer: {
            id: mockPayer.id.toString(),
            label: mockPayer.name,
          },
          networkId: '',
          memberId: '',
        },
      },
      {
        title:
          "correct searchNetworkFormFieldValues with selected primary insurance payer, networkId and memberId if the patient's primary insurance has changed",
        payers: [mockPayer],
        insurancePayerId: '',
        networkOptions: mockNetworkOptions,
        hasInsuranceChanged: true,
        insurancePriority: InsurancePriority.PRIMARY,
        primaryInsurance: mockInsuranceWithEligibleStatus,
        secondaryInsurance: null,
        expectedResult: {
          payer: {
            id: mockPrimaryInsuranceNetwork.insurancePayerId.toString(),
            label: mockPrimaryInsuranceNetwork.insurancePayerName,
          },
          networkId: mockPrimaryInsuranceNetwork.id.toString(),
          memberId: mockInsuranceWithEligibleStatus.memberId.toString(),
        },
      },
      {
        title:
          "correct searchNetworkFormFieldValues with selected secondary insurance payer, networkId and memberId if the patient's insurances have changed",
        payers: [mockPayer],
        insurancePayerId: '',
        networkOptions: mockNetworkOptions,
        hasInsuranceChanged: true,
        insurancePriority: InsurancePriority.SECONDARY,
        primaryInsurance: mockInsuranceWithEligibleStatus,
        secondaryInsurance: mockSecondaryInsurance,
        expectedResult: {
          payer: {
            id: mockSecondaryInsuranceNetwork.insurancePayerId.toString(),
            label: mockSecondaryInsuranceNetwork.insurancePayerName,
          },
          networkId: mockSecondaryInsuranceNetwork.id.toString(),
          memberId: mockSecondaryInsurance.memberId.toString(),
        },
      },
    ])(
      'should return $title',
      ({
        payers,
        insurancePayerId,
        networkOptions,
        hasInsuranceChanged,
        insurancePriority,
        primaryInsurance,
        secondaryInsurance,
        expectedResult,
      }) => {
        const result = getSearchNetworkFormFieldsValues({
          payers,
          insurancePayerId,
          networkOptions,
          hasInsuranceChanged,
          insurancePriority,
          primaryInsurance,
          secondaryInsurance,
        });
        expect(result).toEqual(expectedResult);
      }
    );
  });
});
