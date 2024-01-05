import { StoryFn, Meta } from '@storybook/react';
import { GreetingHeader } from '.';

export default {
  component: GreetingHeader,
  title: 'Header',
} as Meta<typeof GreetingHeader>;

const Template: StoryFn<typeof GreetingHeader> = (args) => (
  <GreetingHeader {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  firstName: 'Sarah',
  visitsCompleted: 80,
  learnMoreLink: '/',
  lastUpdated: '2020-07-08T18:00:08.305Z',
};
