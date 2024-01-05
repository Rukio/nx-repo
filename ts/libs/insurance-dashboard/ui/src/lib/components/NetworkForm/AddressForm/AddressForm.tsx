import { FC, ChangeEventHandler, useId } from 'react';
import {
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  makeSxStyles,
  FormControl,
  SelectChangeEvent,
  InputLabel,
  Box,
  CloseIcon,
  IconButton,
} from '@*company-data-covered*/design-system';
import { NETWORK_FORM_TEST_IDS } from '../testIds';
import { InsuranceNetworkAddress, State } from '../NetworkForm';

export type AddressFormProps = {
  address: InsuranceNetworkAddress;
  states: State[];
  isDisabled?: boolean;
  addressIndex: number;
  addressTitle: string;
  onChangeNetworkAddressFormField: (
    fieldName: string,
    value: string,
    addressToUpdateIndex: number
  ) => void;
  onRemoveAddress: (addressToUpdateIndex: number) => void;
};

const makeStyles = () =>
  makeSxStyles({
    formControl: {
      mt: 3,
    },
    gridHorizontalWrapper: {
      pt: 3,
    },
    formControlTitleContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      mb: 3,
    },
    formControlTitle: {
      textTransform: 'capitalize',
    },
    removeAddressButton: {
      p: 0,
    },
  });

const AddressForm: FC<AddressFormProps> = ({
  address,
  states,
  addressIndex,
  addressTitle,
  onChangeNetworkAddressFormField,
  onRemoveAddress,
  isDisabled = false,
}) => {
  const styles = makeStyles();
  const stateLabelId = useId();

  const handleChangeInput: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => {
    const { name, value } = event.target;
    onChangeNetworkAddressFormField(name, value, addressIndex);
  };
  const handleOnSelectAddressOption = (event: SelectChangeEvent<string>) => {
    const { value, name } = event.target;
    onChangeNetworkAddressFormField(name, value, addressIndex);
  };
  const handleOnRemoveAddress = () => {
    onRemoveAddress(addressIndex);
  };

  return (
    <FormControl
      fullWidth
      sx={styles.formControl}
      data-testid={NETWORK_FORM_TEST_IDS.getAddressFormTestId(addressIndex)}
    >
      <Box sx={styles.formControlTitleContainer}>
        <Typography
          variant="h6"
          sx={styles.formControlTitle}
          data-testid={NETWORK_FORM_TEST_IDS.getAddressFormTitleTestId(
            addressIndex
          )}
        >
          {addressTitle}
        </Typography>
        <IconButton
          data-testid={NETWORK_FORM_TEST_IDS.getRemoveAddressButtonTestId(
            addressIndex
          )}
          sx={styles.removeAddressButton}
          onClick={handleOnRemoveAddress}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <TextField
        label="Address"
        name="addressLineOne"
        fullWidth
        value={address?.addressLineOne ?? ''}
        inputProps={{
          'data-testid':
            NETWORK_FORM_TEST_IDS.getStreetAddressInputTestId(addressIndex),
        }}
        onChange={handleChangeInput}
        disabled={isDisabled}
      />
      <Grid container sx={styles.gridHorizontalWrapper} spacing={3}>
        <Grid item xs={4}>
          <TextField
            label="City"
            name="city"
            fullWidth
            value={address?.city ?? ''}
            inputProps={{
              'data-testid':
                NETWORK_FORM_TEST_IDS.getCityAddressInputTestId(addressIndex),
            }}
            onChange={handleChangeInput}
            disabled={isDisabled}
          />
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel id={stateLabelId}>State</InputLabel>
            <Select
              labelId={stateLabelId}
              label="State"
              fullWidth
              data-testid={NETWORK_FORM_TEST_IDS.getStateAddressSelectTestId(
                addressIndex
              )}
              onChange={handleOnSelectAddressOption}
              name="stateName"
              value={address?.stateName ?? ''}
              disabled={isDisabled}
            >
              {states.map((state) => {
                const selector =
                  NETWORK_FORM_TEST_IDS.getStateAddressSelectOptionTestId(
                    state.id,
                    addressIndex
                  );

                return (
                  <MenuItem
                    key={selector}
                    value={state.name}
                    data-testid={selector}
                  >
                    {state.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Zip Code"
            name="zipCode"
            fullWidth
            value={address?.zipCode ?? ''}
            inputProps={{
              'data-testid':
                NETWORK_FORM_TEST_IDS.getZipAddressInputTestId(addressIndex),
            }}
            onChange={handleChangeInput}
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </FormControl>
  );
};

export default AddressForm;
