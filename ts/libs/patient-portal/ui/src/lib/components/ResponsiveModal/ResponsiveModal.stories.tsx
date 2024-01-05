import { StoryFn, Meta } from '@storybook/react';
import { ResponsiveModal } from './';

export default {
  component: ResponsiveModal,
  title: 'ResponsiveModal',
} as Meta<typeof ResponsiveModal>;

const Template: StoryFn<typeof ResponsiveModal> = (args) => (
  <ResponsiveModal {...args}>
    <div>Modal content</div>
  </ResponsiveModal>
);

export const Primary = Template.bind({});
Primary.args = {
  open: true,
  title: 'Modal title',
};
