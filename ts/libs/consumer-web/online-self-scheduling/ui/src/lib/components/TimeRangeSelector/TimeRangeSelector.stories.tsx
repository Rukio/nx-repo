import { Meta, StoryFn } from '@storybook/react';
import { FieldValues, useForm } from 'react-hook-form';
import TimeRangeSelector, { TimeRangeSelectorProps } from './TimeRangeSelector';

export default {
  title: 'TimeRangeSelector',
  component: TimeRangeSelector,
} as Meta<typeof TimeRangeSelector>;

const Template: StoryFn<typeof TimeRangeSelector> = (
  args: TimeRangeSelectorProps<FieldValues>
) => {
  const { control } = useForm<FieldValues>({
    defaultValues: {
      timeRangeSelect: '12:00:00',
    },
  });

  return <TimeRangeSelector {...args} formControl={control} />;
};

export const Basic = Template.bind({});

Basic.args = {
  timeSelectList: [
    {
      label: '11 am',
      value: '11:00:00',
    },
    {
      label: '12 am',
      value: '12:00:00',
    },
    {
      label: '13 am',
      value: '13:00:00',
    },
  ],
  formFieldName: 'timeRangeSelect',
};
