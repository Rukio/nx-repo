import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import { TextField, TextFieldProps } from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormTextFieldProps<TFieldValues extends FieldValues> = Omit<
  ControllerProps<TFieldValues>,
  'render'
> & {
  textFieldProps: TextFieldProps & FormComponentProps;
};

export const FormTextField = <TFieldValues extends FieldValues>({
  textFieldProps,
  ...controllerProps
}: FormTextFieldProps<TFieldValues>) => (
  <Controller
    {...controllerProps}
    render={({ field: controllerRenderProps, fieldState: { error } }) => (
      <TextField
        {...textFieldProps}
        {...controllerRenderProps}
        helperText={error?.message}
        error={!!error}
      />
    )}
  />
);
