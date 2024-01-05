import { Meta, StoryFn } from '@storybook/react';
import CreditCardFormFields from './CreditCardFormFields';

export default {
  title: 'CreditCardFormFields',
  component: CreditCardFormFields,
  argTypes: {
    showSaveCardOnFileCheckbox: {
      defaultValue: false,
      control: 'boolean',
    },
    errorMessages: {
      table: {
        disable: true,
      },
    },
    onFieldChange: {
      table: {
        disable: true,
      },
    },
    onFieldBlur: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<typeof CreditCardFormFields>;

const Template: StoryFn<typeof CreditCardFormFields> = (args) => (
  <CreditCardFormFields {...args} />
);

export const Basic = Template.bind({});

export const WithErrorMessages = Template.bind({});
WithErrorMessages.args = {
  errorMessages: {
    nameOnCard: 'Name on Card error',
    creditCardNumber: 'Credit Card Number error',
    creditCardExpiration: 'Expiration error',
    creditCardCVV: 'CVV error',
    billingZipCode: 'Billing Zip Code error',
  },
};
