import { FC } from 'react';
import { PatternFormat } from 'react-number-format';
import { InputField, InputFieldProps } from '../InputField';
import { PHONE_NUMBER_INPUT_TEST_IDS } from './testids';

export type PhoneNumberInputProps = InputFieldProps & {
  value: string | undefined;
  onChangeField?: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  inputTestIdPrefix?: string;
};

const PhoneNumberInput: FC<PhoneNumberInputProps> = ({
  label = 'Phone Number',
  placeholder,
  name = 'phone',
  value,
  helperText,
  error,
  disabled,
  onChangeField = () => null,
  inputTestIdPrefix,
}) => (
  <PatternFormat
    placeholder={placeholder}
    disabled={disabled}
    mask="_"
    customInput={InputField}
    format="(###) ###-####"
    fullWidth
    label={label}
    name={name}
    value={value}
    onChange={onChangeField}
    data-testid={PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER}
    inputProps={{
      'data-testid': `${PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER}-${inputTestIdPrefix}`,
    }}
    error={error}
    helperText={helperText}
    valueIsNumericString
  />
);

export default PhoneNumberInput;
