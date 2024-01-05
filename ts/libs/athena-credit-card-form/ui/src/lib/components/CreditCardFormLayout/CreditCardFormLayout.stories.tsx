import { Meta, StoryFn } from '@storybook/react';
import CreditCardFormLayout from './CreditCardFormLayout';

export default {
  title: 'CreditCardFormLayout',
  component: CreditCardFormLayout,
  argTypes: {
    children: {
      defaultValue: 'Children',
      control: 'text',
    },
    errorMessage: {
      control: 'text',
    },
    title: {
      defaultValue: 'Title',
      control: 'text',
    },
    totalToBeChargedText: {
      control: 'text',
    },
    buttonText: {
      defaultValue: 'Continue',
      control: 'text',
    },
    isSubmitButtonDisabled: {
      defaultValue: false,
      control: 'boolean',
    },
    isLoading: {
      defaultValue: false,
      control: 'boolean',
    },
    onSubmit: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<typeof CreditCardFormLayout>;

const Template: StoryFn<typeof CreditCardFormLayout> = (args) => (
  <CreditCardFormLayout {...args} />
);

export const Basic = Template.bind({});

export const WithErrorMessage = Template.bind({});
WithErrorMessage.args = {
  errorMessage: 'Error message',
};
