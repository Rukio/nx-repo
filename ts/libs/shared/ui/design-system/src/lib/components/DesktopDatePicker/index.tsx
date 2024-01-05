import {
  DesktopDatePicker as MuiDesktopDatePicker,
  DesktopDatePickerProps as MuiDesktopDatePickerProps,
} from '@mui/x-date-pickers';

export type DesktopDatePickerProps<TInputDate, TDate> =
  MuiDesktopDatePickerProps<TInputDate, TDate>;

const DesktopDatePicker = <TInputDate, TDate>(
  props: DesktopDatePickerProps<TInputDate, TDate>
) => <MuiDesktopDatePicker {...props} />;

export default DesktopDatePicker;
