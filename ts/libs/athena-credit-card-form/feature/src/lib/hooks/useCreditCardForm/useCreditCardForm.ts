import { FormFieldName } from '@*company-data-covered*/athena-credit-card-form/ui';
import {
  validateRequiredField,
  validateZipCode,
  validateCreditCardNumber,
  validateCreditCardCVV,
  validateCreditCardExpirationDate,
  validateBillingStreetAddress,
  FieldValidation,
} from '@*company-data-covered*/athena-credit-card-form/util';
import { Dispatch, SetStateAction, useState } from 'react';

export type FormFields = Record<FormFieldName, string> &
  Partial<{
    saveCardOnFile: boolean;
  }>;

export type UseCreditCardFormProps = {
  formFields: FormFields;
  setFormFields: Dispatch<SetStateAction<FormFields>>;
};

export const useCreditCardForm = ({
  formFields,
  setFormFields,
}: UseCreditCardFormProps) => {
  const [fieldValidations, setFieldValidations] = useState<
    Record<FormFieldName, FieldValidation>
  >({
    nameOnCard: { isValid: false, errorMessage: '' },
    creditCardNumber: { isValid: false, errorMessage: '' },
    creditCardExpiration: { isValid: false, errorMessage: '' },
    creditCardCVV: { isValid: false, errorMessage: '' },
    billingAddress: { isValid: false, errorMessage: '' },
    billingZipCode: { isValid: false, errorMessage: '' },
  });

  const onFieldChange = (name: string, value: string | boolean) => {
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const getFieldValidation = (fieldName: string) => {
    switch (fieldName) {
      case 'nameOnCard':
        return validateRequiredField(formFields[fieldName]);
      case 'billingZipCode':
        return validateZipCode(formFields[fieldName]);
      case 'creditCardNumber':
        return validateCreditCardNumber(formFields[fieldName]);
      case 'creditCardCVV':
        return validateCreditCardCVV(formFields[fieldName]);
      case 'creditCardExpiration':
        return validateCreditCardExpirationDate(formFields[fieldName]);
      case 'billingAddress':
        return validateBillingStreetAddress(formFields[fieldName]);
      default:
        return null;
    }
  };

  const onFieldBlur = (fieldName: string) => {
    const fieldValidation = getFieldValidation(fieldName);
    if (fieldValidation) {
      setFieldValidations((prev) => ({
        ...prev,
        [fieldName]: getFieldValidation(fieldName),
      }));
    }
  };

  return { onFieldChange, onFieldBlur, fieldValidations };
};
