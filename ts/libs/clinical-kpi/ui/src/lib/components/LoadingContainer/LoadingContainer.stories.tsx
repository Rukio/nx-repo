import { StoryFn, Meta } from '@storybook/react';
import { LoadingContainer } from './';

export default {
  component: LoadingContainer,
  title: 'LoadingContainer',
} as Meta<typeof LoadingContainer>;

const Template: StoryFn<typeof LoadingContainer> = (args) => (
  <LoadingContainer {...args} />
);

export const Primary = Template.bind({});
Primary.args = { testIdPrefix: 'storybook' };
