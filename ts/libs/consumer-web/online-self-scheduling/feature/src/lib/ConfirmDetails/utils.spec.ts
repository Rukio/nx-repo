import {
  mockCreateSelfSchedulingCareRequestPayload,
  mockInsurance,
  mockPatientAccount,
  mockPatientAccountUnverifiedPatient,
  mockSelfScheduleData,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  getAboutYouDetails,
  getAppointmentDetails,
  getAboutPatientDetails,
  getInsuranceDetails,
  DetailsItemLabel,
  confirmDetailsFormSchema,
  createSelfSchedulingCareRequestPayloadSchema,
} from './utils';

describe('getAppointmentDetails', () => {
  const mockPreferredEtaDate = new Date(
    mockSelfScheduleData.preferredEta.patientPreferredEtaStart
  );

  const mockPreferredEtaTomorrowDate = new Date(
    new Date(
      mockSelfScheduleData.preferredEta.patientPreferredEtaStart
    ).setDate(mockPreferredEtaDate.getDate() + 1)
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(mockPreferredEtaDate);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it.each([
    {
      selfScheduleData: mockSelfScheduleData,
      formattedAddress: '123 Main St, City',
      expected: [
        {
          label: DetailsItemLabel.Symptoms,
          value: mockSelfScheduleData.symptoms,
        },
        {
          label: DetailsItemLabel.Availability,
          value: 'Today, July 5 10am - 3pm',
        },
        {
          label: DetailsItemLabel.Address,
          value: '123 Main St, City',
        },
      ],
    },
    {
      selfScheduleData: {
        ...mockSelfScheduleData,
        preferredEta: {
          ...mockSelfScheduleData.preferredEta,
          patientPreferredEtaStart: mockPreferredEtaTomorrowDate,
        },
      },
      formattedAddress: '123 Main St, City',
      expected: [
        {
          label: DetailsItemLabel.Symptoms,
          value: mockSelfScheduleData.symptoms,
        },
        {
          label: DetailsItemLabel.Availability,
          value: 'Tomorrow, July 6 10am - 3pm',
        },
        {
          label: DetailsItemLabel.Address,
          value: '123 Main St, City',
        },
      ],
    },
    {
      formattedAddress: '456 Elm St, Town',
      expected: [
        {
          label: DetailsItemLabel.Address,
          value: '456 Elm St, Town',
        },
      ],
    },
  ])(
    'returns the correct appointment details',
    ({ selfScheduleData, formattedAddress, expected }) => {
      const details = getAppointmentDetails({
        selfScheduleData,
        formattedAddress,
      });
      expect(details).toEqual(expected);
    }
  );
});

describe('getAboutYouDetails', () => {
  const mockPatientDateOfBirth = new Date(
    mockPatientAccountUnverifiedPatient.dateOfBirth
  );

  beforeEach(() => {
    jest
      .useFakeTimers()
      .setSystemTime(
        new Date(mockSelfScheduleData.preferredEta.patientPreferredEtaStart)
      );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it.each([
    {
      isRequesterRelationshipSelf: true,
      unverifiedPatient: mockPatientAccountUnverifiedPatient,
      patientAccount: mockPatientAccount,
      expected: [
        {
          label: DetailsItemLabel.Name,
          value: `${mockPatientAccountUnverifiedPatient.givenName} ${mockPatientAccountUnverifiedPatient.familyName}`,
        },
        {
          label: DetailsItemLabel.DateOfBirth,
          value: `0${
            mockPatientDateOfBirth.getMonth() + 1
          }/${mockPatientDateOfBirth.getDate()}/${mockPatientDateOfBirth.getFullYear()}`,
        },
        {
          label: DetailsItemLabel.LegalSex,
          value: 'M',
        },
        {
          label: DetailsItemLabel.Email,
          value: mockPatientAccount.email,
        },
        {
          label: DetailsItemLabel.PhoneNumber,
          value: mockPatientAccountUnverifiedPatient.phoneNumber,
        },
      ],
    },
    {
      isRequesterRelationshipSelf: false,
      unverifiedPatient: null,
      patientAccount: mockPatientAccount,
      expected: [
        {
          label: DetailsItemLabel.Name,
          value: `${mockPatientAccount.firstName} ${mockPatientAccount.lastName}`,
        },
        {
          label: DetailsItemLabel.Email,
          value: mockPatientAccount.email,
        },
        {
          label: DetailsItemLabel.PhoneNumber,
          value: mockPatientAccount.phone,
        },
      ],
    },
    {
      isRequesterRelationshipSelf: false,
      unverifiedPatient: null,
      expected: [],
    },
  ])(
    'returns the correct about you details',
    ({
      isRequesterRelationshipSelf,
      unverifiedPatient,
      patientAccount,
      expected,
    }) => {
      const details = getAboutYouDetails({
        isRequesterRelationshipSelf,
        unverifiedPatient,
        patientAccount,
      });
      expect(details).toEqual(expected);
    }
  );
});

describe('getAboutPatientDetails', () => {
  const mockPatientDateOfBirth = new Date(
    mockPatientAccountUnverifiedPatient.dateOfBirth
  );

  it.each([
    {
      isRequesterRelationshipSelf: false,
      unverifiedPatient: mockPatientAccountUnverifiedPatient,
      expected: [
        {
          label: DetailsItemLabel.Name,
          value: `${mockPatientAccountUnverifiedPatient.givenName} ${mockPatientAccountUnverifiedPatient.familyName}`,
        },
        {
          label: DetailsItemLabel.PhoneNumber,
          value: mockPatientAccountUnverifiedPatient.phoneNumber,
        },
        {
          label: DetailsItemLabel.DateOfBirth,
          value: `0${
            mockPatientDateOfBirth.getMonth() + 1
          }/${mockPatientDateOfBirth.getDate()}/${mockPatientDateOfBirth.getFullYear()}`,
        },
        {
          label: DetailsItemLabel.LegalSex,
          value: 'M',
        },
      ],
    },
    {
      isRequesterRelationshipSelf: true,
      unverifiedPatient: mockPatientAccountUnverifiedPatient,
      expected: [],
    },
  ])(
    'returns the correct about patient details',
    ({ isRequesterRelationshipSelf, unverifiedPatient, expected }) => {
      const details = getAboutPatientDetails({
        isRequesterRelationshipSelf,
        unverifiedPatient,
      });
      expect(details).toEqual(expected);
    }
  );
});

describe('getInsuranceDetails', () => {
  it.each([
    {
      insurance: mockInsurance,
      expected: [
        {
          label: DetailsItemLabel.Provider,
          value: mockInsurance.insuranceNetwork.insurancePayerName,
        },
        {
          label: DetailsItemLabel.MemberID,
          value: mockInsurance.memberId,
        },
      ],
    },
    {
      insurance: { ...mockInsurance, memberId: '123456' },
      expected: [
        {
          label: DetailsItemLabel.Provider,
          value: mockInsurance.insuranceNetwork.insurancePayerName,
        },
        {
          label: DetailsItemLabel.MemberID,
          value: '***456',
        },
      ],
    },
    {
      insurance: null,
      expected: [],
    },
  ])('returns the correct insurance details', ({ insurance, expected }) => {
    const details = getInsuranceDetails({
      insurance,
    });
    expect(details).toEqual(expected);
  });
});

describe('confirmDetailsFormSchema', () => {
  it.each([
    { name: 'empty values', values: {}, expected: false },
    {
      name: 'falsy isConsented',
      values: { isConsented: false },
      expected: false,
    },
    {
      name: 'truthy isConsented',
      values: { isConsented: true },
      expected: true,
    },
  ])(
    'should return correct valid result for $name',
    async ({ values, expected }) => {
      const isValid = await confirmDetailsFormSchema.isValid(values);

      expect(isValid).toBe(expected);
    }
  );
});

describe('createSelfSchedulingCareRequestPayloadSchema', () => {
  it.each([
    { name: 'empty values', values: {}, expected: false },
    {
      name: 'valid payload',
      values: mockCreateSelfSchedulingCareRequestPayload,
      expected: true,
    },
    {
      name: 'valid payload without risk assessment',
      values: {
        ...mockCreateSelfSchedulingCareRequestPayload,
        riskAssessment: undefined,
      },
      expected: true,
    },
    {
      name: 'invalid risk assessment',
      values: {
        ...mockCreateSelfSchedulingCareRequestPayload,
        riskAssessment: {
          ...mockCreateSelfSchedulingCareRequestPayload.riskAssessment,
          protocolId: '',
        },
      },
      expected: false,
    },
    {
      name: 'invalid risk assessment without dob',
      values: {
        ...mockCreateSelfSchedulingCareRequestPayload,
        riskAssessment: {
          ...mockCreateSelfSchedulingCareRequestPayload.riskAssessment,
          dob: '',
        },
      },
      expected: false,
    },
  ])(
    'should return correct valid result for $name',
    async ({ values, expected }) => {
      const isValid =
        await createSelfSchedulingCareRequestPayloadSchema.isValid(values);

      expect(isValid).toBe(expected);
    }
  );
});
