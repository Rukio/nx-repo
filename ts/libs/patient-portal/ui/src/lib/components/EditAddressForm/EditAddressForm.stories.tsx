import { Meta, StoryFn } from '@storybook/react';
import EditAddressForm from './EditAddressForm';
import { useForm } from 'react-hook-form';
import { AddressObject } from '../../types';

export default {
  title: 'EditAddressForm',
  component: EditAddressForm,
  args: {
    handleSubmit: () => null,
    isSubmitButtonDisabled: false,
  },
} as Meta<typeof EditAddressForm>;

const Template: StoryFn<typeof EditAddressForm> = (args) => {
  const { control } = useForm<AddressObject>({
    defaultValues: {
      streetAddress1: '',
      streetAddress2: '',
      city: '',
      state: '',
    },
  });

  return <EditAddressForm {...args} control={control} />;
};

export const Basic = Template.bind({});
