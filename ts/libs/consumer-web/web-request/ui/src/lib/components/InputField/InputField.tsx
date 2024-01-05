import { FC, useMemo, useState, FocusEvent } from 'react';
import { TextField, TextFieldProps } from '@*company-data-covered*/design-system';

export type InputFieldProps = TextFieldProps & {
  errorMessage?: string;
  'data-testid'?: string;
};

const InputField: FC<InputFieldProps> = ({
  onFocus,
  onBlur,
  error,
  helperText,
  errorMessage,
  ...rest
}) => {
  const [isFocused, setFocused] = useState(false);
  const onFocused = (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>
  ) => {
    setFocused(true);
    onFocus?.(event);
  };
  const onBlurred = (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>
  ) => {
    setFocused(false);
    onBlur?.(event);
  };

  const helperTextToShow = useMemo(() => {
    if (error && !isFocused) {
      return errorMessage || helperText || '';
    }
    if (error && isFocused && !errorMessage) {
      return '';
    }

    return helperText || '';
  }, [error, isFocused, helperText, errorMessage]);

  return (
    <TextField
      {...rest}
      onFocus={onFocused}
      onBlur={onBlurred}
      error={!isFocused ? error : false}
      helperText={helperTextToShow}
    />
  );
};

export default InputField;
