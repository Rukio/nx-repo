import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  TextField,
  TextFieldProps,
  DatePicker,
  DatePickerProps,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormDatePickerProps<
  TFieldValues extends FieldValues,
  TInputDate,
  TDate
> = Omit<ControllerProps<TFieldValues>, 'render'> & {
  textFieldProps: TextFieldProps & FormComponentProps;
  datePickerProps?: Omit<
    DatePickerProps<TInputDate, TDate>,
    'renderInput' | 'onChange' | 'value'
  >;
};

export const FormDatePicker = <
  TFieldValues extends FieldValues,
  TInputDate,
  TDate
>({
  textFieldProps,
  datePickerProps,
  ...controllerProps
}: FormDatePickerProps<TFieldValues, TInputDate, TDate>) => (
  <Controller
    {...controllerProps}
    render={({ field: { ref, ...rest }, fieldState: { error } }) => (
      <DatePicker<TInputDate, TDate>
        {...datePickerProps}
        {...rest}
        inputRef={ref}
        renderInput={(params) => (
          <TextField
            {...params}
            {...textFieldProps}
            onBlur={rest.onBlur}
            inputProps={{
              ...params.inputProps,
              ...textFieldProps.inputProps,
            }}
            helperText={error?.message}
            error={!!error}
          />
        )}
      />
    )}
  />
);
