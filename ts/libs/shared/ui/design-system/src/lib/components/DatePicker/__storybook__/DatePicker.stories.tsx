import { useState } from 'react';
import { Meta } from '@storybook/react';

import DatePicker, { DatePickerProps } from '../index';
import {
  LocalizationProvider,
  TextField,
  TextFieldProps,
} from '../../../index';

export default {
  title: 'DatePicker',
  component: DatePicker,
} as Meta<typeof DatePicker>;

type BasicProps = Omit<
  DatePickerProps<string, string>,
  'onChange' | 'renderInput' | 'value' | 'label'
>;
export const Basic = (props: BasicProps) => {
  const [value, setValue] = useState<string | null>(null);

  return (
    <LocalizationProvider>
      <DatePicker
        label="Basic example"
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
        }}
        renderInput={(params: TextFieldProps) => <TextField {...params} />}
        {...props}
      />
    </LocalizationProvider>
  );
};
