import { AddressPayload, STATES } from '@*company-data-covered*/patient-portal/ui';
import { object, string, ObjectSchema } from 'yup';

export const VALID_ZIP_CODE_REG_EXP = /^\d{5}(-?\d{4})?$/g;

export const addressValidationSchema: ObjectSchema<AddressPayload> =
  object().shape({
    streetAddress1: string().required('Street Address is required'),
    streetAddress2: string().optional(),
    locationDetails: string().optional(),
    city: string().required('City is required'),
    state: string()
      .required('State is required')
      .oneOf(
        STATES.map((option) => option.abbreviation),
        'State is required'
      ),
    zipCode: string()
      .matches(VALID_ZIP_CODE_REG_EXP, 'Zip Code should have correct format')
      .required('Zip Code is required'),
  });
