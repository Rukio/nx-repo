import {
  DatePicker as MuiDatePicker,
  DatePickerProps as MuiDatePickerProps,
} from '@mui/x-date-pickers';

export type DatePickerProps<TInputDate, TDate> = MuiDatePickerProps<
  TInputDate,
  TDate
>;

const DatePicker = <TInputDate, TDate>(
  props: DatePickerProps<TInputDate, TDate>
) => <MuiDatePicker {...props} />;

export default DatePicker;
