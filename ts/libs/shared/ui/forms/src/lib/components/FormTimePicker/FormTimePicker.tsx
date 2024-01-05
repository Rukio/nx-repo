import { Controller, ControllerProps, FieldValues } from 'react-hook-form';
import {
  TextField,
  TextFieldProps,
  TimePicker,
  TimePickerProps,
} from '@*company-data-covered*/design-system';
import { FormComponentProps } from '../../types';

export type FormTimePickerProps<
  TFieldValues extends FieldValues,
  TInputTime,
  TDate
> = Omit<ControllerProps<TFieldValues>, 'render'> & {
  textFieldProps: TextFieldProps & FormComponentProps;
  timePickerProps?: Omit<
    TimePickerProps<TInputTime, TDate>,
    'renderInput' | 'onChange' | 'value'
  >;
};

export const FormTimePicker = <
  TFieldValues extends FieldValues,
  TInputTime,
  TDate
>({
  textFieldProps,
  timePickerProps,
  ...controllerProps
}: FormTimePickerProps<TFieldValues, TInputTime, TDate>) => (
  <Controller
    {...controllerProps}
    render={({ field: { ref, ...rest }, fieldState: { error } }) => (
      <TimePicker<TInputTime, TDate>
        {...timePickerProps}
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
