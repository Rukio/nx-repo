import { StoryFn, Meta } from '@storybook/react';
import { Error } from '.';

export default {
  component: Error,
  title: 'Error',
} as Meta<typeof Error>;

const Template: StoryFn<typeof Error> = (args) => <Error {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  text: 'Looks like something went wrong. Please check back later.',
  buttonText: 'Continue to Dashboard',
  buttonLink: '/',
};
