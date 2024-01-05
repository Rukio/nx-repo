import { FC } from 'react';
import {
  Box,
  Button,
  AddIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import Address from '../Address/Address';
import { FormattedList } from '../FormattedList';
import { EditableFormattedListItem } from '../SettingsList';
import { AddressObject } from '../../types';
import { SAVED_ADDRESSES_TEST_IDS } from './testIds';

export type SavedAddressesProps = {
  addresses: AddressObject[];
  onAddAddress: () => void;
  onEditAddress: (addressId: string) => void;
};

const makeStyles = () =>
  makeSxStyles({
    addressList: {
      pt: 3,
    },
    addressWrapper: (theme) => ({
      color: theme.palette.text.primary,
    }),
    buttonsWrapper: {
      display: 'flex',
      alignItems: 'center',
      pt: 1,
    },
  });

const SavedAddresses: FC<SavedAddressesProps> = ({
  addresses,
  onAddAddress,
  onEditAddress,
}) => {
  const styles = makeStyles();

  return (
    <Box>
      <Box sx={styles.addressList}>
        <FormattedList
          testIdPrefix={SAVED_ADDRESSES_TEST_IDS.LIST_PREFIX}
          excludeLastNthItemDividers={0}
        >
          {addresses.map((address) => (
            <EditableFormattedListItem
              testIdPrefix={SAVED_ADDRESSES_TEST_IDS.getListItemPrefix(
                address.id
              )}
              key={address.id}
              onClick={() => onEditAddress(address.id)}
            >
              <Box sx={styles.addressWrapper}>
                <Address {...address} />
              </Box>
            </EditableFormattedListItem>
          ))}
        </FormattedList>
      </Box>
      <Box sx={styles.buttonsWrapper}>
        <Button
          data-testid={SAVED_ADDRESSES_TEST_IDS.ADD_ADDRESS_BUTTON}
          onClick={onAddAddress}
          variant="text"
          color="primary"
          startIcon={<AddIcon />}
        >
          Add Address
        </Button>
      </Box>
    </Box>
  );
};

export default SavedAddresses;
