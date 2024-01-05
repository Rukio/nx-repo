import { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import CreateAddressForm from './CreateAddressForm';
import { useForm } from 'react-hook-form';
import { AddressPayload } from '../../types';

export default {
  title: 'CreateAddressForm',
  component: CreateAddressForm,
  args: {
    handleSubmit: () => null,
    isSubmitButtonDisabled: false,
  },
} as Meta<typeof CreateAddressForm>;

const Template: StoryFn<typeof CreateAddressForm> = (args) => {
  const { control } = useForm<AddressPayload>({
    defaultValues: {
      streetAddress1: '',
      streetAddress2: '',
      city: '',
      state: '',
    },
  });

  return (
    <MemoryRouter>
      <CreateAddressForm {...args} control={control} />
    </MemoryRouter>
  );
};

export const Basic = Template.bind({});
