import { FC, useState } from 'react';
import PlacesAutocomplete, { Suggestion } from 'react-places-autocomplete';
import {
  TextField,
  MenuItem,
  FormControl,
  MenuList,
  Paper,
  theme,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { getAddressInfo, GoogleAddress } from '../../utils';

export interface AddressInputProps {
  placeholder?: string;
  disabled?: boolean;
  setAddress?: (address: GoogleAddress | null) => void;
  beforeSelect?: () => void;
  initialValue?: string;
  initialSuggestions?: Suggestion[];
}

const makeStyles = () =>
  makeSxStyles({
    root: { position: 'relative' },
    rootList: {
      position: 'absolute',
      width: '100%',
      left: 0,
      top: '100%',
      maxHeight: 200,
      overflow: 'auto',
      background: theme.palette.background.paper,
      zIndex: theme.zIndex.modal,
    },
  });

const searchOptions = {
  types: ['address'],
  componentRestrictions: {
    country: ['us'],
  },
};

const AddressInput: FC<AddressInputProps> = ({
  setAddress,
  placeholder,
  disabled,
  initialValue,
  initialSuggestions,
  beforeSelect,
}) => {
  const styles = makeStyles();
  const [inputValue, changeInputValue] = useState(initialValue || '');
  const [isValidAddress, setIsValidAddress] = useState(true);
  const onChangeAutocomplete = (ev: string) => changeInputValue(ev);
  const onSelectAddress = (address: string) => {
    changeInputValue(address);
    beforeSelect?.();
    setIsValidAddress(true);
    getAddressInfo(address).then(({ parsedAddress, coordinates }) => {
      if (parsedAddress.streetNumber && parsedAddress.postalCode) {
        setAddress?.({
          ...parsedAddress,
          ...coordinates,
          city: parsedAddress.city || parsedAddress.township || '',
        });
      } else {
        setAddress?.(null);
        setIsValidAddress(false);
      }
    });
  };

  return (
    <PlacesAutocomplete
      onChange={onChangeAutocomplete}
      value={inputValue}
      onSelect={onSelectAddress}
      searchOptions={searchOptions}
    >
      {({ getInputProps, suggestions, getSuggestionItemProps }) => {
        const { onChange, value } = getInputProps();
        const finalSuggestions = initialSuggestions || suggestions;

        return (
          <FormControl sx={styles.root} fullWidth>
            <TextField
              data-testid="address-field"
              inputProps={{ 'data-testid': 'address-field-input' }}
              sx={{ mt: 3 }}
              error={!isValidAddress}
              disabled={disabled}
              value={value}
              onChange={onChange}
              label={placeholder || 'Enter your address'}
              helperText={
                !isValidAddress
                  ? "Enter a valid address to confirm if we're in your service area."
                  : ''
              }
              fullWidth
            />
            {!!finalSuggestions?.length && (
              <Paper sx={styles.rootList}>
                <MenuList>
                  {finalSuggestions?.map((suggestion) => (
                    <MenuItem
                      {...getSuggestionItemProps(suggestion)}
                      dense
                      key={`address-suggestion-${suggestion.placeId}`}
                      data-testid="address-suggestion-menuitem"
                    >
                      {suggestion.description}
                    </MenuItem>
                  ))}
                </MenuList>
              </Paper>
            )}
          </FormControl>
        );
      }}
    </PlacesAutocomplete>
  );
};

export default AddressInput;
