import { Meta, StoryFn } from '@storybook/react';
import FormFooter from './FormFooter';

export default {
  title: 'Footer',
  component: FormFooter,
} as Meta<typeof FormFooter>;

const Template: StoryFn<typeof FormFooter> = (args) => <FormFooter {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  onSubmit: () => console.log('Button pressed'),
  helperText:
    'Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. ',
};

export const ButtonOnly = Template.bind({});
ButtonOnly.args = {
  submitButtonLabel: 'Start',
  onSubmit: () => console.log('Button pressed'),
};
