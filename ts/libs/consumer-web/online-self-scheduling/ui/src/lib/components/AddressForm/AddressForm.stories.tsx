import { Meta, StoryFn } from '@storybook/react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, Box, makeSxStyles } from '@*company-data-covered*/design-system';
import AddressForm, { AddressFormFieldValues } from './AddressForm';

const defaultAddressFormFieldValues: AddressFormFieldValues = {
  zipCode: '',
  streetAddress1: '',
  streetAddress2: '',
  city: '',
  state: '',
  locationType: '',
  locationDetails: '',
  selectedAddressId: '',
};

const makeStyles = () =>
  makeSxStyles({
    bodyWrapper: { display: 'flex', justifyContent: 'center' },
    formWrapper: { width: 600 },
  });

export default {
  title: 'AddressForm',
  component: AddressForm,
  args: {
    formHeaderTitle: 'Where should we send our team?',
    formHeaderSubtitle:
      'Enter ZIP Code to confirm that the address is in our service area',
    stateOptions: [{ value: 'DEN', label: 'Denver' }],
    locationTypeOptions: [{ value: 'home', label: 'Home' }],
    isFormFooterVisible: true,
    isSubmitButtonDisabled: false,
    onSubmit: () => console.log('onSubmit'),
  },
} as Meta<typeof AddressForm>;

const Template: StoryFn<typeof AddressForm> = (args) => {
  const styles = makeStyles();
  const { control } = useForm<AddressFormFieldValues>({
    values: defaultAddressFormFieldValues,
  });

  const selectedAddressId = useWatch({ control, name: 'selectedAddressId' });

  return (
    <Box sx={styles.bodyWrapper}>
      <Box sx={styles.formWrapper}>
        <AddressForm
          {...args}
          selectedAddressId={selectedAddressId}
          formControl={control}
        />
      </Box>
    </Box>
  );
};

export const Basic = Template.bind({});

export const WithErrorAddressAvailabilityAlert = Template.bind({});
WithErrorAddressAvailabilityAlert.args = {
  isLocationFieldsSectionVisible: false,
  isFormFooterVisible: false,
  addressAvailabilityAlert: (
    <Alert
      severity="error"
      title="Sorry, we’re not available in that location."
      message="Our recommendation is that the patient goes to their nearest urgent care or contacts their primary care provider."
    />
  ),
};

export const WithAddressLocationFieldsSection = Template.bind({});
WithAddressLocationFieldsSection.args = {
  isLocationFieldsSectionVisible: true,
  addressAvailabilityAlert: (
    <Alert
      severity="success"
      message="Great news! That location is in our service area"
    />
  ),
};

export const WithRadioButtons = Template.bind({});
WithRadioButtons.args = {
  isLocationFieldsSectionVisible: true,
  formHeaderSubtitle: 'Select the address where you’d like to be seen.',
  radioOptions: [
    { value: '1', label: '5830 Elliot Avenue, #202' },
    { value: '2', label: '1234 Nowhere Drive' },
    { value: '', label: 'Add New Address' },
  ],
  addressAvailabilityAlert: (
    <Alert
      severity="success"
      message="Great news! That location is in our service area"
    />
  ),
};

export const WithInvalidAddress = Template.bind({});
WithInvalidAddress.args = {
  isInvalidAddressAlertVisible: true,
  isLocationFieldsSectionVisible: true,
  formHeaderTitle: 'Confirm your address',
  formHeaderSubtitle: '',
  addressAvailabilityAlert: (
    <Alert
      severity="success"
      message="Great news! That location is in our service area"
    />
  ),
};
