import { StoryFn, Meta } from '@storybook/react';
import { Modal } from './';

export default {
  component: Modal,
  title: 'Modal',
} as Meta<typeof Modal>;

const Template: StoryFn<typeof Modal> = (args) => (
  <Modal {...args}>
    <div>Modal content</div>
  </Modal>
);

export const Primary = Template.bind({});
Primary.args = {
  open: true,
};
