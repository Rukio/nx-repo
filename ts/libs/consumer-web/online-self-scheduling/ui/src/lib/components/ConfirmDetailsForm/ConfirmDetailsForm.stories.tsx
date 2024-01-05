import { Meta, StoryFn } from '@storybook/react';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import ConfirmDetailsForm, {
  ConfirmDetailsFormFieldValues,
} from './ConfirmDetailsForm';
import { useForm } from 'react-hook-form';

const makeStyles = () =>
  makeSxStyles({
    bodyWrapper: { display: 'flex', justifyContent: 'center' },
    formWrapper: { width: 600 },
  });

export default {
  title: 'ConfirmDetailsForm',
  component: ConfirmDetailsForm,
  args: {
    formHeaderSubtitle:
      'One last step! Please review your details below before booking your appointment. ',
    aboutYouDetails: [
      { label: 'Name', value: 'Alexandra Anderson' },
      { label: 'Email', value: 'aanderson87@gmail.com' },
      { label: 'Phone Number', value: '(508) 555-9302' },
    ],
    insuranceDetails: [
      { label: 'Provider', value: 'Aetna' },
      { label: 'Member ID', value: '*******821' },
    ],
    appointmentDetails: [
      { label: 'Primary Symptom', value: 'Back Pain' },
      { label: 'Availability', value: 'Today, March 28 11am - 10pm' },
      { label: 'Address', value: '5830 Elliot Avenue, #202 Denver, CO 80205' },
    ],
    isEditingEnabled: false,
    onEditDetails: () => console.log('onEditDetails'),
    isSubmitButtonDisabled: false,
    onSubmit: () => console.log('onSubmit'),
  },
  argTypes: {
    formControl: {
      table: {
        disable: true,
      },
    },
    onSubmit: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<typeof ConfirmDetailsForm>;

const Template: StoryFn<typeof ConfirmDetailsForm> = (args) => {
  const styles = makeStyles();

  const { control } = useForm<ConfirmDetailsFormFieldValues>({
    values: { isConsented: true },
  });

  return (
    <Box sx={styles.bodyWrapper}>
      <Box sx={styles.formWrapper}>
        <ConfirmDetailsForm {...args} formControl={control} />
      </Box>
    </Box>
  );
};

export const Basic = Template.bind({});

export const WithAboutPatientDetails = Template.bind({});
WithAboutPatientDetails.args = {
  aboutPatientDetails: [
    { label: 'Name', value: 'Hunter Anderson' },
    { label: 'Phone Number', value: '(508) 555-9302' },
    { label: 'Date of Birth', value: '09/28/1987' },
    { label: 'Legal Sex', value: 'Female' },
  ],
};
