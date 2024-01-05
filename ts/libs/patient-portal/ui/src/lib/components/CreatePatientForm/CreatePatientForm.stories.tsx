import { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import CreatePatientForm, {
  CreatePatientFormFields,
} from './CreatePatientForm';
import { useForm } from 'react-hook-form';

export default {
  title: 'CreatePatientForm',
  component: CreatePatientForm,
  args: {
    handleSubmit: () => null,
    isSubmitButtonDisabled: false,
  },
} as Meta<typeof CreatePatientForm>;

const Template: StoryFn<typeof CreatePatientForm> = (args) => {
  const { control } = useForm<CreatePatientFormFields>({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phoneNumber: '',
      assignedSexAtBirth: '',
      genderIdentity: '',
    },
  });

  return (
    <MemoryRouter>
      <CreatePatientForm {...args} control={control} />
    </MemoryRouter>
  );
};

export const Basic = Template.bind({});
