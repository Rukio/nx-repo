import { StoryFn, Meta } from '@storybook/react';
import { Confirmation } from '.';

export default {
  component: Confirmation,
  title: 'Confirmation',
} as Meta<typeof Confirmation>;

const Template: StoryFn<typeof Confirmation> = (args) => (
  <Confirmation {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  alertMessage: 'Are you sure you want to delete this?',
  buttonText: 'Delete',
  handleSubmit: () => null,
  testIdPrefix: 'delete-confirmation',
};
