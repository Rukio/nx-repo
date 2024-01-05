import { object, ObjectSchema, string } from 'yup';
import {
  AddressFormFieldValues,
  AddressFormSelectOption,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';

const getRequiredErrorMessage = (name: string) => `${name} is required`;

const ZIP_CODE_REGEX = /^\d{5}(-?\d{4})?$/g;

const checkForEmptyValue = (value?: string) => !value;

export const addressFormSchema = (
  stateOptions: AddressFormSelectOption[]
): ObjectSchema<AddressFormFieldValues> =>
  object().shape({
    zipCode: string().when('selectedAddressId', {
      is: checkForEmptyValue,
      then: (schema) =>
        schema
          .required(getRequiredErrorMessage('ZIP Code'))
          .matches(ZIP_CODE_REGEX, 'Invalid ZIP Code'),
      otherwise: (schema) => schema.optional(),
    }),
    streetAddress1: string().when('selectedAddressId', {
      is: checkForEmptyValue,
      then: (schema) =>
        schema.required(getRequiredErrorMessage('Street Address')),
      otherwise: (schema) => schema.optional(),
    }),
    streetAddress2: string().optional(),
    city: string().when('selectedAddressId', {
      is: checkForEmptyValue,
      then: (schema) => schema.required(getRequiredErrorMessage('City')),
      otherwise: (schema) => schema.optional(),
    }),
    state: string().when('selectedAddressId', {
      is: checkForEmptyValue,
      then: (schema) =>
        schema
          .required(getRequiredErrorMessage('State'))
          .oneOf(
            stateOptions?.map((option) => option.value) || [],
            getRequiredErrorMessage('State')
          ),
      otherwise: (schema) => schema.optional(),
    }),
    locationType: string().when('selectedAddressId', {
      is: checkForEmptyValue,
      then: (schema) =>
        schema.required(getRequiredErrorMessage('Location Type')),
      otherwise: (schema) => schema.optional(),
    }),
    locationDetails: string().optional(),
    selectedAddressId: string().optional(),
  });
