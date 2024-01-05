import { Meta, StoryFn } from '@storybook/react';
import CreditCardPreview, { CardNameType } from './CreditCardPreview';

export default {
  title: 'CreditCardPreview',
  component: CreditCardPreview,
  argTypes: {
    creditCardExpiration: {
      defaultValue: '02/2025',
      control: 'text',
    },
    creditCardNumberLastDigits: {
      defaultValue: '4242',
      control: 'text',
    },
    creditCardType: {
      defaultValue: CardNameType.Mastercard,
      options: [...Object.keys(CardNameType), 'other'],
      control: 'radio',
    },
    onDelete: {
      table: { disable: true },
    },
  },
} as Meta<typeof CreditCardPreview>;

const Template: StoryFn<typeof CreditCardPreview> = (args) => (
  <CreditCardPreview {...args} />
);

export const Basic = Template.bind({});
