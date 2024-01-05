import { Meta, StoryFn } from '@storybook/react';
import SavedAddresses from './SavedAddresses';
import { ADDRESSES_MOCKS } from './mocks';

export default {
  title: 'SavedAddresses',
  component: SavedAddresses,
  args: {
    addresses: ADDRESSES_MOCKS,
  },
} as Meta<typeof SavedAddresses>;

const Template: StoryFn<typeof SavedAddresses> = (args) => {
  return <SavedAddresses {...args} />;
};

export const Basic = Template.bind({});
