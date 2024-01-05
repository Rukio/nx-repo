import { boolean, object, ObjectSchema, number, string, array } from 'yup';
import { format, isToday, isValid } from 'date-fns';
import {
  CreateSelfSchedulingCareRequestPayload,
  DomainPatientInsurance,
  DomainUnverifiedPatient,
  PatientAccount,
  SelfScheduleData,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  ConfirmDetailsFormFieldValues,
  Details,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';

export enum DetailsItemLabel {
  Symptoms = 'Symptoms',
  Availability = 'Availability',
  Address = 'Address',
  Name = 'Name',
  DateOfBirth = 'Date Of Birth',
  LegalSex = 'Legal Sex',
  Email = 'Email',
  PhoneNumber = 'Phone Number',
  Provider = 'Provider',
  MemberID = 'Member ID',
}

const formatName = (firstName?: string, lastName?: string) => {
  return [firstName, lastName].filter((nameItem) => !!nameItem).join(' ');
};

const formatDateOfBirth = (date?: string | Date) => {
  if (!date) {
    return '';
  }

  const dateOfBirth = new Date(date);

  if (!isValid(dateOfBirth)) {
    return '';
  }

  return format(dateOfBirth, 'MM/dd/y');
};

const formatAvailabilityDetails = (
  startDate?: string | Date,
  endDate?: string | Date
) => {
  if (!startDate || !endDate) {
    return '';
  }
  const startAvailabilityDate = new Date(startDate);
  const endAvailabilityDate = new Date(endDate);

  if (!isValid(startAvailabilityDate) || !isValid(endAvailabilityDate)) {
    return '';
  }
  const availabilityDay = isToday(startAvailabilityDate) ? 'Today' : 'Tomorrow';

  const availabilityDetailsFormattedStart = format(
    startAvailabilityDate,
    'MMMM d haaa'
  );

  const availabilityDetailsFormattedEnd = format(endAvailabilityDate, 'haaa');

  return `${availabilityDay}, ${availabilityDetailsFormattedStart} - ${availabilityDetailsFormattedEnd}`;
};

const formatLegalSex = (legalSex?: string) => {
  if (!legalSex) {
    return '';
  }

  return legalSex.charAt(0).toUpperCase() + legalSex.slice(1);
};

const formatInsuranceMemberId = (memberId?: string | number) => {
  if (!memberId) {
    return '';
  }

  const stringifiedMemberId = memberId.toString();

  const last3DigitsStartIndex = stringifiedMemberId.length - 3;

  const maskChar = '*';

  const maskedPart = maskChar.repeat(last3DigitsStartIndex);
  const lastThreeDigits = stringifiedMemberId.slice(last3DigitsStartIndex);

  return maskedPart + lastThreeDigits;
};

const filterNotEmptyDetailsItem = (detailsItem: Details) => !!detailsItem.value;

export const getAppointmentDetails = ({
  selfScheduleData,
  formattedAddress,
}: {
  selfScheduleData?: SelfScheduleData;
  formattedAddress: string;
}): Details[] => {
  return [
    {
      label: DetailsItemLabel.Symptoms,
      value: selfScheduleData?.symptoms || '',
    },
    {
      label: DetailsItemLabel.Availability,
      value: formatAvailabilityDetails(
        selfScheduleData?.preferredEta?.patientPreferredEtaStart,
        selfScheduleData?.preferredEta?.patientPreferredEtaEnd
      ),
    },
    { label: DetailsItemLabel.Address, value: formattedAddress },
  ].filter(filterNotEmptyDetailsItem);
};

export const getAboutYouDetails = ({
  isRequesterRelationshipSelf,
  unverifiedPatient,
  patientAccount,
}: {
  isRequesterRelationshipSelf: boolean;
  unverifiedPatient: DomainUnverifiedPatient | null;
  patientAccount?: PatientAccount;
}): Details[] => {
  if (isRequesterRelationshipSelf) {
    return [
      {
        label: DetailsItemLabel.Name,
        value: formatName(
          unverifiedPatient?.givenName,
          unverifiedPatient?.familyName
        ),
      },
      {
        label: DetailsItemLabel.DateOfBirth,
        value: formatDateOfBirth(unverifiedPatient?.dateOfBirth),
      },
      {
        label: DetailsItemLabel.LegalSex,
        value: formatLegalSex(unverifiedPatient?.legalSex),
      },
      {
        label: DetailsItemLabel.Email,
        value: patientAccount?.email || '',
      },
      {
        label: DetailsItemLabel.PhoneNumber,
        value: unverifiedPatient?.phoneNumber || '',
      },
    ].filter(filterNotEmptyDetailsItem);
  }

  return [
    {
      label: DetailsItemLabel.Name,
      value: formatName(patientAccount?.firstName, patientAccount?.lastName),
    },
    {
      label: DetailsItemLabel.Email,
      value: patientAccount?.email || '',
    },
    {
      label: DetailsItemLabel.PhoneNumber,
      value: patientAccount?.phone || '',
    },
  ].filter(filterNotEmptyDetailsItem);
};

export const getAboutPatientDetails = ({
  isRequesterRelationshipSelf,
  unverifiedPatient,
}: {
  isRequesterRelationshipSelf: boolean;
  unverifiedPatient: DomainUnverifiedPatient | null;
}): Details[] => {
  if (isRequesterRelationshipSelf) {
    return [];
  }

  return [
    {
      label: DetailsItemLabel.Name,
      value: formatName(
        unverifiedPatient?.givenName,
        unverifiedPatient?.familyName
      ),
    },
    {
      label: DetailsItemLabel.PhoneNumber,
      value: unverifiedPatient?.phoneNumber || '',
    },
    {
      label: DetailsItemLabel.DateOfBirth,
      value: formatDateOfBirth(unverifiedPatient?.dateOfBirth),
    },
    {
      label: DetailsItemLabel.LegalSex,
      value: formatLegalSex(unverifiedPatient?.legalSex),
    },
  ].filter(filterNotEmptyDetailsItem);
};

export const getInsuranceDetails = ({
  insurance,
}: {
  insurance: DomainPatientInsurance | null;
}): Details[] => {
  if (!insurance) {
    return [];
  }

  return [
    {
      label: DetailsItemLabel.Provider,
      value: insurance.insuranceNetwork?.insurancePayerName || '',
    },
    {
      label: DetailsItemLabel.MemberID,
      value: formatInsuranceMemberId(insurance.memberId),
    },
  ].filter(filterNotEmptyDetailsItem);
};

export const confirmDetailsFormSchema: ObjectSchema<ConfirmDetailsFormFieldValues> =
  object()
    .shape({
      // Return empty message as required by design
      isConsented: boolean().required().isTrue(''),
    })
    .required();

const dateSchema = string().test(
  'birthday',
  'Date of Birth is not valid',
  (value) => {
    if (!value) {
      return true;
    }

    return isValid(new Date(value));
  }
);

export const createSelfSchedulingCareRequestPayloadSchema: ObjectSchema<CreateSelfSchedulingCareRequestPayload> =
  object().shape({
    mpoaConsent: object()
      .shape({
        powerOfAttorneyId: number().required(),
      })
      .required(),
    riskAssessment: object()
      .shape({
        dob: dateSchema.required(),
        gender: string().required(),
        worstCaseScore: number().required(),
        score: number().required(),
        protocolId: number().required(),
        protocolName: string().required(),
        responses: object().shape({ questions: array().required() }).required(),
        overrideReason: string().ensure(),
        complaint: object()
          .shape({
            symptom: string().required(),
            selectedSymptoms: string().required(),
          })
          .required(),
      })
      .default(undefined),
    careRequest: object()
      .shape({
        marketId: number().required(),
        patientId: number().required(),
        placeOfService: string().required(),
        requester: object()
          .shape({
            firstName: string().required(),
            lastName: string().required(),
            phone: string().required(),
            relationToPatient: string().required(),
            organizationName: string().required(),
          })
          .required(),
        address: object()
          .shape({
            city: string().required(),
            state: string().required(),
            zip: string().required(),
            streetAddress1: string().required(),
            streetAddress2: string().optional(),
            additionalDetails: string().optional(),
          })
          .required(),
        complaint: object().shape({ symptoms: string().required() }).required(),
        channelItemId: number().required(),
        patientPreferredEta: object()
          .shape({
            patientPreferredEtaStart: dateSchema.required(),
            patientPreferredEtaEnd: dateSchema.required(),
          })
          .required(),
      })
      .required(),
  });
