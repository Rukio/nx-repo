import { FC } from 'react';
import { useField } from 'formik';
import { TextField } from '@*company-data-covered*/design-system';

type FieldData = {
  name: string;
  label: string;
};

type FormikInputFieldProps = {
  fieldData: FieldData;
  fullWidth?: boolean;
  autoFocus?: boolean;
  type?: string;
  variant?: 'outlined' | 'standard' | 'filled';
  multiline?: boolean;
  minRows?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  rows?: number;
};

export const FormikInputField: FC<FormikInputFieldProps> = ({
  fieldData,
  onKeyDown,
  fullWidth = false,
  autoFocus = false,
  type = 'text',
  variant = 'outlined',
  multiline = false,
  ...rest
}) => {
  const [field, meta] = useField(fieldData);
  const { touched, error } = meta;
  const isInErrorState = !!(touched && error);

  const renderHelperText = () => {
    if (isInErrorState) {
      return error;
    }

    return null;
  };

  const textFieldProps = {
    InputLabelProps: {
      htmlFor: field.name,
    },
  };

  return (
    <TextField
      type={type}
      id={fieldData.name}
      label={fieldData.label}
      error={isInErrorState}
      helperText={renderHelperText()}
      inputProps={{
        'data-testid': `${fieldData.name.toLowerCase()}-input`,
      }}
      variant={variant}
      multiline={multiline}
      onKeyDown={onKeyDown}
      fullWidth={fullWidth}
      autoFocus={autoFocus}
      {...textFieldProps}
      {...field}
      {...rest}
    />
  );
};
