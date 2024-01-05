import { Meta, StoryFn } from '@storybook/react';
import Address from './Address';

export default {
  title: 'Address',
  component: Address,
  args: {
    id: '123',
    streetAddress1: '100 Elm ST',
    streetAddress2: '#203',
    city: 'Denver',
    state: 'CO',
    zipCode: '80205',
  },
} as Meta<typeof Address>;

const Template: StoryFn<typeof Address> = (args) => {
  return <Address {...args} />;
};

export const Basic = Template.bind({});
