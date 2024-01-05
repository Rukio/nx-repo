import { Meta, StoryFn } from '@storybook/react';
import SelectTimeWindow, {
  SelectTimeWindowProps,
  SelectTimeWindowFieldValues,
} from './SelectTimeWindow';
import { AvailabilityDayToggleValue } from '../TimeWindowsSection';
import { useForm } from 'react-hook-form';

export default {
  title: 'SelectTimeWindow',
  component: SelectTimeWindow,
} as Meta<typeof SelectTimeWindow>;

const Template: StoryFn<typeof SelectTimeWindow> = (
  args: SelectTimeWindowProps
) => {
  const { control } = useForm<SelectTimeWindowFieldValues>({
    defaultValues: {
      startTime: '12:00:00',
      endTime: '13:00:00',
      selectedAvailabilityDay: AvailabilityDayToggleValue.Today,
    },
  });

  return <SelectTimeWindow {...args} formControl={control} />;
};

export const Basic = Template.bind({});
Basic.args = {
  title: 'When are you available for an appointment?',
  subtitle:
    'The more availability you have, the more likely we can see you today.',
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
