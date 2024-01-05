import { TextField, TextFieldProps } from '@*company-data-covered*/design-system';
import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import { PatternFormat, PatternFormatProps } from 'react-number-format';
import { FormComponentProps } from '../../types';

export type FormPatternFormatProps<TFieldValues extends FieldValues> = Omit<
  ControllerProps<TFieldValues>,
  'render'
> & {
  patternFormatProps: PatternFormatProps<TextFieldProps> & FormComponentProps;
};

export const FormPatternFormat = <TFieldValues extends FieldValues>({
  patternFormatProps,
  ...controllerProps
}: FormPatternFormatProps<TFieldValues>) => (
  <Controller
    {...controllerProps}
    render={({ field: { ref, ...rest }, fieldState: { error } }) => (
      <PatternFormat
        customInput={TextField}
        {...patternFormatProps}
        {...rest}
        inputRef={ref}
        helperText={error?.message}
        error={!!error}
      />
    )}
  />
);
