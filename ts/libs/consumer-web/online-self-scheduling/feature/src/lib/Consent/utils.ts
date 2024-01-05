import {
  ConsentFormFieldValues,
  DefaultConsentQuestionAnswer,
  DefaultConsentQuestionAnswerVariant,
  MedicalDecisionMakerQuestionAnswer,
  MedicalDecisionMakerQuestionAnswerVariant,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { mixed, object, ObjectSchema, string } from 'yup';

const getRequiredErrorMessage = (name: string) => `${name} is required`;

const phoneNumberSchema = string().test(
  'phone',
  'Phone Number is not valid',
  (value) => {
    if (!value) {
      return true;
    }

    return !!value && isValidPhoneNumber(value, 'US');
  }
);

const medicalDecisionMakerQuestionAnswerVariants: MedicalDecisionMakerQuestionAnswerVariant[] =
  [...Object.values(MedicalDecisionMakerQuestionAnswer), ''];

const commonSchema: ObjectSchema<
  Pick<ConsentFormFieldValues, 'firstConsentQuestion' | 'secondConsentQuestion'>
> = object().shape({
  firstConsentQuestion: mixed<DefaultConsentQuestionAnswerVariant>()
    .required()
    .oneOf(Object.values(DefaultConsentQuestionAnswer)),
  secondConsentQuestion: mixed<DefaultConsentQuestionAnswerVariant>().when(
    'firstConsentQuestion',
    {
      is: DefaultConsentQuestionAnswer.No,
      then: (schema) =>
        schema.required().oneOf(Object.values(DefaultConsentQuestionAnswer)),
      otherwise: (schema) => schema.optional(),
    }
  ),
});

export const consentFormSchema: ObjectSchema<ConsentFormFieldValues> = object()
  .concat(commonSchema)
  .shape({
    thirdConsentQuestion: mixed<MedicalDecisionMakerQuestionAnswerVariant>()
      .optional()
      .oneOf(medicalDecisionMakerQuestionAnswerVariants),
    firstName: string().when('secondConsentQuestion', {
      is: DefaultConsentQuestionAnswer.Yes,
      then: (schema) => schema.required(getRequiredErrorMessage('First Name')),
      otherwise: (schema) => schema.optional(),
    }),
    lastName: string().when('secondConsentQuestion', {
      is: DefaultConsentQuestionAnswer.Yes,
      then: (schema) => schema.required(getRequiredErrorMessage('Last Name')),
      otherwise: (schema) => schema.optional(),
    }),
    phoneNumber: phoneNumberSchema.when('secondConsentQuestion', {
      is: DefaultConsentQuestionAnswer.Yes,
      then: (schema) =>
        schema.required(getRequiredErrorMessage('Phone Number')),
      otherwise: (schema) => schema.optional(),
    }),
  })
  .required();

export const consentFormWithNonSelfRequesterRelationSchema: ObjectSchema<ConsentFormFieldValues> =
  object()
    .concat(commonSchema)
    .shape({
      thirdConsentQuestion:
        mixed<MedicalDecisionMakerQuestionAnswerVariant>().when(
          'secondConsentQuestion',
          {
            is: DefaultConsentQuestionAnswer.Yes,
            then: (schema) =>
              schema
                .required()
                .oneOf(Object.values(MedicalDecisionMakerQuestionAnswer)),
            otherwise: (schema) => schema.optional(),
          }
        ),
      firstName: string().when('thirdConsentQuestion', {
        is: MedicalDecisionMakerQuestionAnswer.SomeoneElse,
        then: (schema) =>
          schema.required(getRequiredErrorMessage('First Name')),
        otherwise: (schema) => schema.optional(),
      }),
      lastName: string().when('thirdConsentQuestion', {
        is: MedicalDecisionMakerQuestionAnswer.SomeoneElse,
        then: (schema) => schema.required(getRequiredErrorMessage('Last Name')),
        otherwise: (schema) => schema.optional(),
      }),
      phoneNumber: phoneNumberSchema.when('thirdConsentQuestion', {
        is: MedicalDecisionMakerQuestionAnswer.SomeoneElse,
        then: (schema) =>
          schema.required(getRequiredErrorMessage('Phone Number')),
        otherwise: (schema) => schema.optional(),
      }),
    })
    .required();

export const comparePatientNameToPOAName = (
  patientFullName: string,
  patientPOAName: string
): boolean => {
  return patientFullName.toLowerCase() === patientPOAName.toLowerCase();
};
