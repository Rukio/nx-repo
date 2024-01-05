import { Meta } from '@storybook/react';
import { useState } from 'react';

import LocalizationProvider from '../../LocalizationProvider';
import { TextField } from '../../..';
import DesktopDatePicker, { DesktopDatePickerProps } from '../index';

export default {
  title: 'DesktopDatePicker',
  component: DesktopDatePicker,
} as Meta<typeof DesktopDatePicker>;

type BasicProps = Omit<
  DesktopDatePickerProps<string, string>,
  'onChange' | 'renderInput' | 'value' | 'label'
>;
export const Basic = (props: BasicProps) => {
  const [value, setValue] = useState<string | null>(null);

  return (
    <LocalizationProvider>
      <DesktopDatePicker
        label="Basic example"
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
        }}
        renderInput={(params) => <TextField {...params} />}
        {...props}
      />
    </LocalizationProvider>
  );
};
