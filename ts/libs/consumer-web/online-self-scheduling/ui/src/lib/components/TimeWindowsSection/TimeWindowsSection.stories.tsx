import { Meta, StoryFn } from '@storybook/react';
import TimeWindowsSection, {
  TimeWindowsSectionProps,
} from './TimeWindowsSection';
import { useForm } from 'react-hook-form';
import { SelectTimeWindowFieldValues } from '../SelectTimeWindow/SelectTimeWindow';

export default {
  title: 'TimeWindowsSection',
  component: TimeWindowsSection,
} as Meta<typeof TimeWindowsSection>;

const Template: StoryFn<typeof TimeWindowsSection> = (
  args: TimeWindowsSectionProps
) => {
  const { control } = useForm<SelectTimeWindowFieldValues>({
    defaultValues: {
      startTime: '12:00:00',
    },
  });

  return <TimeWindowsSection {...args} formControl={control} />;
};

export const Basic = Template.bind({});
Basic.args = {
  title: `I'm available`,
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
  isTimeRangeErrorShown: true,
};
