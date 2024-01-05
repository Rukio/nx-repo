import { Meta, StoryFn } from '@storybook/react';
import LoadingSection from './LoadingSection';

export default {
  title: 'LoadingSection',
  component: LoadingSection,
  parameters: {
    backgrounds: { default: 'light' },
  },
  args: {
    title: 'Finding your care team',
    subtitle:
      'Based on your details, we’re finding the best medical team to come to you.',
  },
} as Meta<typeof LoadingSection>;

const Template: StoryFn<typeof LoadingSection> = (args) => (
  <LoadingSection {...args} />
);

export const Basic = Template.bind({});
