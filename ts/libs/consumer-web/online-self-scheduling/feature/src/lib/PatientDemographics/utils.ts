import {
  AssignedSexAtBirth,
  Gender,
  GenderIdentity,
  PatientAccountPatient,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { PatientDemographicsFormFieldValues } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { isValid } from 'date-fns';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { mixed, object, ObjectSchema, string, StringSchema } from 'yup';

export const ADD_SOMEONE_ELSE_OPTION = 'Add Someone Else';

export const isGenderIdentityOtherSelected = (value?: string) =>
  value === GenderIdentity.Other;

const getRequiredErrorMessage = (name: string) => `${name} is required`;
const getOneOfErrorMessage =
  (name: string) =>
  ({ values }: { values: string }) =>
    `${name} must be one of the following values: ${values}`;

const phoneSchema = string().test(
  'phone',
  'Phone Number is not valid',
  (value) => {
    if (!value) {
      return true;
    }

    return !!value && isValidPhoneNumber(value, 'US');
  }
);

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

type GetSelectedPatientIdSchemaProps = {
  accountPatients?: PatientAccountPatient[];
};

const checkSelectedPatientIdValue = (value: string) =>
  value === ADD_SOMEONE_ELSE_OPTION || !value;

const commonSchema: ObjectSchema<
  Omit<
    PatientDemographicsFormFieldValues,
    | 'requesterFirstName'
    | 'requesterLastName'
    | 'requesterPhone'
    | 'selectedPatientId'
  >
> = object().shape({
  patientFirstName: string().when('selectedPatientId', {
    is: checkSelectedPatientIdValue,
    then: (schema) => schema.required(getRequiredErrorMessage('First name')),
    otherwise: (schema) => schema.optional(),
  }),
  patientMiddleName: string().optional(),
  patientLastName: string().when('selectedPatientId', {
    is: checkSelectedPatientIdValue,
    then: (schema) => schema.required(getRequiredErrorMessage('Last name')),
    otherwise: (schema) => schema.optional(),
  }),
  patientSuffix: string().optional(),
  patientPhone: phoneSchema.when('selectedPatientId', {
    is: checkSelectedPatientIdValue,
    then: (schema) => schema.required(getRequiredErrorMessage('Phone Number')),
    otherwise: (schema) => schema.optional(),
  }),
  birthday: dateSchema.when('selectedPatientId', {
    is: checkSelectedPatientIdValue,
    then: (schema) => schema.required(getRequiredErrorMessage('Date of Birth')),
    otherwise: (schema) => schema.optional(),
  }),
  legalSex: mixed<Gender>().when('selectedPatientId', {
    is: checkSelectedPatientIdValue,
    then: (schema) =>
      schema
        .required(getRequiredErrorMessage('Legal Sex'))
        .oneOf(Object.values(Gender), getOneOfErrorMessage('Legal Sex')),
    otherwise: (schema) => schema.optional(),
  }),
  assignedSexAtBirth: mixed<AssignedSexAtBirth | string>()
    .optional()
    .oneOf([...Object.values(AssignedSexAtBirth), '']),
  genderIdentity: mixed<GenderIdentity | string>()
    .optional()
    .oneOf([...Object.values(GenderIdentity), '']),
  genderIdentityDetails: string().when('genderIdentity', {
    is: isGenderIdentityOtherSelected,
    then: (schema) =>
      schema.required(getRequiredErrorMessage('Gender Identity Details')),
    otherwise: (schema) => schema.optional(),
  }),
});

export const getSelectedPatientIdSchema = ({
  accountPatients,
}: GetSelectedPatientIdSchemaProps): StringSchema<string | undefined> =>
  accountPatients?.length
    ? string()
        .oneOf([
          ...accountPatients.map((accountPatient) =>
            accountPatient?.id?.toString()
          ),
          ADD_SOMEONE_ELSE_OPTION,
        ])
        .required(
          `Please select an existing patient or ${ADD_SOMEONE_ELSE_OPTION}`
        )
    : string().optional();

export const getPatientDemographicsFormSchema = ({
  accountPatients,
}: GetSelectedPatientIdSchemaProps): ObjectSchema<PatientDemographicsFormFieldValues> =>
  object()
    .concat(commonSchema)
    .shape({
      requesterFirstName: string().optional(),
      requesterLastName: string().optional(),
      requesterPhone: phoneSchema.optional(),
      selectedPatientId: getSelectedPatientIdSchema({ accountPatients }),
    })
    .required();

export const getPatientDemographicsFormWithNonSelfRelationshipSchema = ({
  accountPatients,
}: GetSelectedPatientIdSchemaProps): ObjectSchema<PatientDemographicsFormFieldValues> =>
  object()
    .concat(commonSchema)
    .shape({
      requesterFirstName: string().when('selectedPatientId', {
        is: checkSelectedPatientIdValue,
        then: (schema) =>
          schema.required(getRequiredErrorMessage('First name')),
        otherwise: (schema) => schema.optional(),
      }),
      requesterLastName: string().when('selectedPatientId', {
        is: checkSelectedPatientIdValue,
        then: (schema) => schema.required(getRequiredErrorMessage('Last name')),
        otherwise: (schema) => schema.optional(),
      }),
      requesterPhone: phoneSchema.when('selectedPatientId', {
        is: checkSelectedPatientIdValue,
        then: (schema) =>
          schema.required(getRequiredErrorMessage('Phone number')),
        otherwise: (schema) => schema.optional(),
      }),
      selectedPatientId: getSelectedPatientIdSchema({ accountPatients }),
    })
    .required();
