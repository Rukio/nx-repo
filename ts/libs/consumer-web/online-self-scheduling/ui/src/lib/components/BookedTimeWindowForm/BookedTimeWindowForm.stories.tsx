import { Meta, StoryFn } from '@storybook/react';
import BookedTimeWindowForm, {
  BookedTimeWindowFormProps,
  BookedTimeWindowFormFieldValues,
} from './BookedTimeWindowForm';
import { AvailabilityDayToggleValue } from '../TimeWindowsSection';
import { useForm } from 'react-hook-form';

export default {
  title: 'BookedTimeWindowForm',
  component: BookedTimeWindowForm,
} as Meta<typeof BookedTimeWindowForm>;

const defaultArgs = {
  openTimeAlertMessage: 'Open tomorrow from 8 am - 10 pm',
  timeWindowSectionTitle: 'I am available',
  isTimeRangeErrorShown: true,
  startTimeOptions: [
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
  endTimeOptions: [
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
};

const Template: StoryFn<typeof BookedTimeWindowForm> = (
  args: BookedTimeWindowFormProps
) => {
  const { control } = useForm<BookedTimeWindowFormFieldValues>({
    defaultValues: {
      startTime: '12:00:00',
      endTime: '13:00:00',
      selectedAvailabilityDay: AvailabilityDayToggleValue.Today,
    },
  });

  return <BookedTimeWindowForm {...args} formControl={control} />;
};

export const Basic = Template.bind({});
Basic.args = defaultArgs;
