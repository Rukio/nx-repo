import { FC, ReactNode, useMemo } from 'react';
import { Control } from 'react-hook-form';
import {
  Alert,
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  FormTextField,
  FormSelect,
  FormRadioGroup,
  getFormSelectMenuItems,
} from '@*company-data-covered*/shared/ui/forms';
import {
  DatadogPrivacyOption,
  getDataDogPrivacyHTMLAttributes,
} from '@*company-data-covered*/shared/datadog/util';
import { FormHeader } from '../FormHeader';
import { FormFooter } from '../FormFooter';
import { ADDRESS_FORM_TEST_IDS } from './testIds';

export type AddressFormFieldValues = {
  zipCode?: string;
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  locationType?: string;
  locationDetails?: string;
  selectedAddressId?: string;
};

export type AddressFormSelectOption = { value: string; label: string };

export type AddressFormProps = {
  formHeaderTitle: string;
  formHeaderSubtitle: string;
  formControl: Control<AddressFormFieldValues>;
  isInvalidAddressAlertVisible?: boolean;
  isLocationFieldsSectionVisible?: boolean;
  addressAvailabilityAlert?: ReactNode;
  stateOptions: AddressFormSelectOption[];
  locationTypeOptions: AddressFormSelectOption[];
  isFormFooterVisible: boolean;
  isSubmitButtonLoading?: boolean;
  isSubmitButtonDisabled: boolean;
  onSubmit: () => void;
  selectedAddressId?: string;
  radioOptions?: AddressFormSelectOption[];
};

const makeStyles = () =>
  makeSxStyles({
    formContentIndents: { mt: 3 },
  });

const AddressForm: FC<AddressFormProps> = ({
  formHeaderTitle,
  formHeaderSubtitle,
  formControl,
  selectedAddressId = '',
  isInvalidAddressAlertVisible = false,
  isLocationFieldsSectionVisible = false,
  addressAvailabilityAlert,
  stateOptions,
  radioOptions,
  locationTypeOptions,
  isFormFooterVisible,
  isSubmitButtonLoading = false,
  isSubmitButtonDisabled,
  onSubmit,
}) => {
  const styles = makeStyles();

  const radioOptionsToRender = useMemo(() => {
    if (!radioOptions) {
      return [];
    }

    return radioOptions?.map((option) => ({
      ...option,
      'data-testid': ADDRESS_FORM_TEST_IDS.getAddressRadioOption(option.value),
      ...getDataDogPrivacyHTMLAttributes(DatadogPrivacyOption.Mask),
    }));
  }, [radioOptions]);

  const renderFieldsSection = () => (
    <>
      {isInvalidAddressAlertVisible && (
        <Alert
          severity="error"
          title="Invalid Address"
          message="We can’t validate the address you entered. Please enter a correct address."
          sx={styles.formContentIndents}
          data-testid={ADDRESS_FORM_TEST_IDS.INVALID_ADDRESS_ALERT}
        />
      )}
      <FormTextField
        name="zipCode"
        control={formControl}
        textFieldProps={{
          label: 'ZIP Code',
          fullWidth: true,
          sx: styles.formContentIndents,
          'data-testid': ADDRESS_FORM_TEST_IDS.ZIP_CODE_FIELD,
          inputProps: {
            'data-testid': ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT,
          },
        }}
      />
      {!!addressAvailabilityAlert && (
        <Box
          sx={styles.formContentIndents}
          data-testid={ADDRESS_FORM_TEST_IDS.ADDRESS_AVAILABILITY_ALERT}
        >
          {addressAvailabilityAlert}
        </Box>
      )}
      {isLocationFieldsSectionVisible && (
        <Box data-testid={ADDRESS_FORM_TEST_IDS.LOCATION_FIELDS_SECTION}>
          <FormTextField
            name="streetAddress1"
            control={formControl}
            textFieldProps={{
              label: 'Street Address',
              fullWidth: true,
              sx: styles.formContentIndents,
              'data-testid': ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_PRIMARY_FIELD,
              inputProps: {
                'data-testid':
                  ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_PRIMARY_INPUT,
              },
            }}
          />
          <FormControl fullWidth>
            <FormTextField
              name="streetAddress2"
              control={formControl}
              textFieldProps={{
                label: 'Unit / Apt / Suite Number',
                fullWidth: true,
                sx: styles.formContentIndents,
                'data-testid':
                  ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_SECONDARY_FIELD,
                inputProps: {
                  'data-testid':
                    ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_SECONDARY_INPUT,
                },
              }}
            />
            <FormHelperText>Optional</FormHelperText>
          </FormControl>
          <FormTextField
            name="city"
            control={formControl}
            textFieldProps={{
              label: 'City',
              fullWidth: true,
              sx: styles.formContentIndents,
              'data-testid': ADDRESS_FORM_TEST_IDS.CITY_FIELD,
              inputProps: {
                'data-testid': ADDRESS_FORM_TEST_IDS.CITY_INPUT,
              },
            }}
          />
          <FormControl
            fullWidth
            sx={styles.formContentIndents}
            data-testid={ADDRESS_FORM_TEST_IDS.STATE_FIELD}
          >
            <InputLabel>State</InputLabel>
            <FormSelect
              name="state"
              control={formControl}
              selectProps={{
                label: 'State',
                fullWidth: true,
                'data-testid': ADDRESS_FORM_TEST_IDS.STATE_SELECT,
              }}
            >
              {getFormSelectMenuItems(
                stateOptions,
                ADDRESS_FORM_TEST_IDS.STATE_SELECT_ITEM_PREFIX
              )}
            </FormSelect>
          </FormControl>
          <FormControl
            fullWidth
            sx={styles.formContentIndents}
            data-testid={ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_FIELD}
          >
            <InputLabel>Location Type</InputLabel>
            <FormSelect
              name="locationType"
              control={formControl}
              selectProps={{
                label: 'Location Type',
                fullWidth: true,
                'data-testid': ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT,
              }}
            >
              {getFormSelectMenuItems(
                locationTypeOptions,
                ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT_ITEM_PREFIX
              )}
            </FormSelect>
          </FormControl>
          <FormControl fullWidth>
            <FormTextField
              name="locationDetails"
              control={formControl}
              textFieldProps={{
                label: 'Location Details',
                fullWidth: true,
                sx: styles.formContentIndents,
                'data-testid': ADDRESS_FORM_TEST_IDS.LOCATION_DETAILS_FIELD,
                inputProps: {
                  'data-testid': ADDRESS_FORM_TEST_IDS.LOCATION_DETAILS_INPUT,
                },
              }}
            />
            <FormHelperText>
              Gate code, parking instructions, etc. (Optional)
            </FormHelperText>
          </FormControl>
        </Box>
      )}
    </>
  );

  return (
    <Box data-testid={ADDRESS_FORM_TEST_IDS.ROOT}>
      <FormHeader title={formHeaderTitle} subtitle={formHeaderSubtitle} />
      {radioOptionsToRender?.length ? (
        <Box
          sx={styles.formContentIndents}
          data-testid={ADDRESS_FORM_TEST_IDS.RADIO_ROOT}
        >
          <FormRadioGroup
            control={formControl}
            radioOptions={radioOptionsToRender}
            name="selectedAddressId"
          />
          {!selectedAddressId && renderFieldsSection()}
        </Box>
      ) : (
        renderFieldsSection()
      )}
      {isFormFooterVisible && (
        <Box sx={styles.formContentIndents}>
          <FormFooter
            isSubmitButtonLoading={isSubmitButtonLoading}
            isSubmitButtonDisabled={isSubmitButtonDisabled}
            onSubmit={onSubmit}
          />
        </Box>
      )}
    </Box>
  );
};

export default AddressForm;
