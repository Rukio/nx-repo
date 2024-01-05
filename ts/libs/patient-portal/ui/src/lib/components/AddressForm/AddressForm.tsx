import { FC } from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormHelperText,
  MenuItem,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FormSelect, FormTextField } from '@*company-data-covered*/shared/ui/forms';
import { ADDRESS_FORM_TEST_IDS } from './testIds';
import { AddressPayload } from '../../types';
import { STATES } from '../../states';

export type AddressFormProps = {
  control: Control<AddressPayload>;
  testIdPrefix: string;
};

const makeStyles = () =>
  makeSxStyles({
    formControl: {
      mt: 3,
    },
    defaultSelectValue: {
      color: 'text.disabled',
    },
  });

const AddressForm: FC<AddressFormProps> = ({ control, testIdPrefix }) => {
  const styles = makeStyles();

  const renderSelectValue = (value: string) => {
    const selectedState = STATES.find((state) => state.abbreviation === value);
    if (!selectedState) {
      return <Typography sx={styles.defaultSelectValue}>State</Typography>;
    }

    return <>{selectedState.name}</>;
  };

  return (
    <>
      <FormControl sx={styles.formControl} fullWidth>
        <FormTextField
          name="streetAddress1"
          control={control}
          textFieldProps={{
            'data-testid':
              ADDRESS_FORM_TEST_IDS.getStreetAddress1FormControlTestId(
                testIdPrefix
              ),
            fullWidth: true,
            inputProps: {
              'data-testid':
                ADDRESS_FORM_TEST_IDS.getStreetAddress1InputTestId(
                  testIdPrefix
                ),
            },
            placeholder: 'Address',
          }}
        />
      </FormControl>
      <FormControl sx={styles.formControl} fullWidth>
        <FormTextField
          name="streetAddress2"
          control={control}
          textFieldProps={{
            'data-testid':
              ADDRESS_FORM_TEST_IDS.getStreetAddress2FormControlTestId(
                testIdPrefix
              ),
            fullWidth: true,
            helperText: 'Optional',
            inputProps: {
              'data-testid':
                ADDRESS_FORM_TEST_IDS.getStreetAddress2InputTestId(
                  testIdPrefix
                ),
            },
            placeholder: 'Unit Number',
          }}
        />
        <FormHelperText>Optional</FormHelperText>
      </FormControl>
      <FormControl sx={styles.formControl} fullWidth>
        <FormTextField
          name="locationDetails"
          control={control}
          textFieldProps={{
            'data-testid':
              ADDRESS_FORM_TEST_IDS.getLocationDetailsFormControlTestId(
                testIdPrefix
              ),
            fullWidth: true,
            inputProps: {
              'data-testid':
                ADDRESS_FORM_TEST_IDS.getLocationDetailsInputTestId(
                  testIdPrefix
                ),
            },
            placeholder: 'Location Details',
          }}
        />
        <FormHelperText>
          Gate code, parking instructions, etc. (Optional)
        </FormHelperText>
      </FormControl>
      <FormControl sx={styles.formControl} fullWidth>
        <FormTextField
          name="city"
          control={control}
          textFieldProps={{
            'data-testid':
              ADDRESS_FORM_TEST_IDS.getCityFormControlTestId(testIdPrefix),
            fullWidth: true,
            inputProps: {
              'data-testid':
                ADDRESS_FORM_TEST_IDS.getCityInputTestId(testIdPrefix),
            },
            placeholder: 'City',
          }}
        />
      </FormControl>
      <FormControl
        sx={styles.formControl}
        data-testid={ADDRESS_FORM_TEST_IDS.getStateFormControlTestId(
          testIdPrefix
        )}
        fullWidth
      >
        <FormSelect
          name="state"
          control={control}
          selectProps={{
            'data-testid': ADDRESS_FORM_TEST_IDS.getStateTestId(testIdPrefix),
            fullWidth: true,
            renderValue: renderSelectValue,
            displayEmpty: true,
          }}
        >
          {STATES.map((option) => (
            <MenuItem
              data-testid={ADDRESS_FORM_TEST_IDS.getAddressFormStateOptionTestId(
                testIdPrefix,
                option.abbreviation
              )}
              key={option.abbreviation}
              value={option.abbreviation}
            >
              {option.name}
            </MenuItem>
          ))}
        </FormSelect>
      </FormControl>
      <FormControl sx={styles.formControl} fullWidth>
        <FormTextField
          name="zipCode"
          control={control}
          textFieldProps={{
            'data-testid':
              ADDRESS_FORM_TEST_IDS.getZipCodeFormControlTestId(testIdPrefix),
            fullWidth: true,
            inputProps: {
              'data-testid':
                ADDRESS_FORM_TEST_IDS.getZipCodeInputTestId(testIdPrefix),
            },
            placeholder: 'ZIP Code',
          }}
        />
      </FormControl>
    </>
  );
};

export default AddressForm;
