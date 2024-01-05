import { Meta, StoryFn } from '@storybook/react';
import SelfSchedulingConfirmation, {
  SelfSchedulingConfirmationProps,
} from './SelfSchedulingConfirmation';
import { Typography } from '@*company-data-covered*/design-system';

export default {
  title: 'SelfSchedulingConfirmation',
  component: SelfSchedulingConfirmation,
} as Meta<typeof SelfSchedulingConfirmation>;

const Template: StoryFn<typeof SelfSchedulingConfirmation> = (
  args: SelfSchedulingConfirmationProps
) => <SelfSchedulingConfirmation {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  *company-data-covered*PhoneNumber: '333-333-333',
  subtitle: (
    <Typography>
      Your medical team will be out to see you today
      <b> 10:00 AM and 15:00 PM.</b>
      <br />
      <br />
      Check your text messages to check-in for your appointment and receive
      status updates.
    </Typography>
  ),
};
