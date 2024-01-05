import { Meta, StoryFn } from '@storybook/react';
import { useForm } from 'react-hook-form';
import {
  WhoNeedsCareForm,
  WhoNeedsCareFormFieldValues,
} from './WhoNeedsCareForm';

const meta: Meta<typeof WhoNeedsCareForm> = {
  title: 'WhoNeedsCareForm',
  component: WhoNeedsCareForm,
  argTypes: {
    formControl: {
      table: { disable: true },
    },
  },
};

export default meta;

export const Basic: StoryFn<typeof WhoNeedsCareForm> = (args) => {
  const { control } = useForm<WhoNeedsCareFormFieldValues>();

  return <WhoNeedsCareForm {...args} formControl={control} />;
};

Basic.args = {
  relationshipToPatientOptions: [
    { value: 'myself', label: 'Myself' },
    { value: 'friend', label: 'Friend' },
  ],
};
