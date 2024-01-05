import { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import AddressForm from './AddressForm';
import { useForm } from 'react-hook-form';
import { AddressPayload } from '../../types';

export default {
  title: 'AddressForm',
  component: AddressForm,
  args: {},
} as Meta<typeof AddressForm>;

const Template: StoryFn<typeof AddressForm> = (args) => {
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
      <AddressForm {...args} control={control} />
    </MemoryRouter>
  );
};

export const Basic = Template.bind({});
