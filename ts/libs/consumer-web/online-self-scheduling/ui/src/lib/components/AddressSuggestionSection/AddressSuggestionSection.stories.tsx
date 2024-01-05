import { Meta, StoryFn } from '@storybook/react';
import { AddressSuggestionSection } from './AddressSuggestionSection';

export default {
  title: 'AddressSuggestionSection',
  component: AddressSuggestionSection,
  args: {
    isAutocorrectedResponseButtonLoading: false,
    validatedAddress: '5830 Elliot Avenue APT 202 Denver, Colorado 80205-3316',
    onClickValidatedAddress: () => console.log('onClickValidatedAddress'),
    enteredAddress: '5830 Elliot Ave #202 Denver, Colorado 80205',
    onClickEnteredAddress: () => console.log('onClickEnteredAddress'),
  },
} as Meta<typeof AddressSuggestionSection>;

const Template: StoryFn<typeof AddressSuggestionSection> = (args) => (
  <AddressSuggestionSection {...args} />
);

export const Basic = Template.bind({});
