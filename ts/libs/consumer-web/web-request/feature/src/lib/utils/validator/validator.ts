import { useRef, useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { isValidPhoneNumber } from 'libphonenumber-js';

interface ValidationRuleResponse {
  isValid: boolean;
  error: string | null;
}
interface ValidationFieldObject extends ValidationRuleResponse {
  isTouched: boolean;
}
export interface ValidatorResponse {
  isValidForm: boolean;
  fields: {
    [key: string]: ValidationFieldObject;
  };
}

type State = Record<string, unknown>;

type Rules = Record<string, string>;

export const EMAIL_REG_EXP =
  /^[A-Z0-9!#$%&'*+-/=?^_`{|}~]+@[A-Z0-9.-]+\.[A-Z]{2,}$/gi;
export const STRING_REG_EX = /^[A-Z-,.;'&/() ]{2,50}$/gi;

const validationRules = {
  required: (val: string | number): ValidationRuleResponse => {
    const isValid = !!val;

    return {
      isValid,
      error: !isValid ? 'This field is required' : null,
    };
  },
  string: (val: string): ValidationRuleResponse => {
    const isValid = !!val?.match(STRING_REG_EX);

    return {
      isValid,
      error: !isValid
        ? "This field should contain A-Z,-,.;'&/() and a space. Max length 50"
        : null,
    };
  },
  email: (val: string): ValidationRuleResponse => {
    const isValid = !!val?.match(EMAIL_REG_EXP);

    return {
      isValid,
      error: !isValid ? 'This field must be an email' : null,
    };
  },
  phone: (val: string): ValidationRuleResponse => {
    const isValid = isValidPhoneNumber(val, 'US');

    return {
      isValid,
      error: !isValid ? 'Please enter a valid phone number.' : null,
    };
  },
  birthday: (val: string): ValidationRuleResponse => {
    try {
      const dateValue = dayjs(val);
      const dateYear: number = new Date(val).getFullYear();

      return {
        isValid:
          dateValue.isValid() &&
          !dateValue.isAfter(new Date()) &&
          // checking if a year is 4 digits and no "0" at the beginning
          /^(?!0)\d{4}$/.test(String(dateYear)) &&
          new Date().getFullYear() - 125 < dateYear,
        error: 'Enter a valid date',
      };
    } catch (_err) {
      return {
        isValid: false,
        error: 'Enter a valid date',
      };
    }
  },
};

export function validate(
  state: State = {},
  rules: Rules = {},
  initialValues: State = {}
): ValidatorResponse {
  return Object.keys(state).reduce<ValidatorResponse>(
    (prev, currentKey) => {
      const currentRules = rules[currentKey]?.split?.('|') || [];
      const currentErrors = currentRules
        .map((rule) =>
          validationRules[rule as keyof typeof validationRules]?.(
            state?.[currentKey] as string
          )
        )
        .filter((err) => err && !err.isValid);
      const isValidField = !currentErrors?.length;

      const errorMessage = currentErrors?.[0]?.error || null;

      return {
        ...prev,
        fields: {
          ...prev.fields,
          [currentKey]: {
            isValid: isValidField,
            error: errorMessage,
            isTouched: initialValues?.[currentKey] !== state?.[currentKey],
          },
        },
        isValidForm: !isValidField ? false : prev.isValidForm ?? true,
      };
    },
    { isValidForm: true, fields: {} }
  );
}

export const useValidation = (
  state: State,
  rules: Rules
): ValidatorResponse => {
  const initialValues = useRef(state);

  return useMemo(
    () => validate(state, rules, initialValues.current),
    [state, rules]
  );
};

export const useFormValidation = (
  state: State,
  rules: Rules
): {
  formValidations: ValidatorResponse;
  validateField: (fieldName: string) => void;
  validateForm: () => boolean;
} => {
  const initialValues = useRef(state);

  const [formValidations, setFormValidations] = useState(
    validate(state, rules, initialValues.current)
  );

  const validateField = useCallback(
    (fieldName: string) => {
      const newValidations = validate(state, rules, initialValues.current);

      setFormValidations((prev) => ({
        ...prev,
        isValidForm: newValidations.isValidForm,
        fields: {
          ...prev.fields,
          [fieldName]: newValidations.fields[fieldName],
        },
      }));
    },
    [state, rules]
  );

  const validateForm = useCallback(() => {
    const validations = validate(state, rules, initialValues.current);
    setFormValidations(validations);

    return validations.isValidForm;
  }, [state, rules]);

  return {
    formValidations,
    validateField,
    validateForm,
  };
};

export default validate;
