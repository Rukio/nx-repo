import { StoryFn, Meta } from '@storybook/react';
import { Drawer } from './';

export default {
  component: Drawer,
  title: 'Drawer',
} as Meta<typeof Drawer>;

const Template: StoryFn<typeof Drawer> = (args) => (
  <Drawer {...args}>
    <div>Drawer content</div>
  </Drawer>
);

export const Primary = Template.bind({});
Primary.args = {
  open: true,
};
