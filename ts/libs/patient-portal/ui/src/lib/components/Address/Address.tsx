import { FC } from 'react';
import { Box, Typography } from '@*company-data-covered*/design-system';
import { ADDRESS_TEST_IDS } from './testIds';
import { AddressObject } from '../../types';

export type AddressProps = Omit<AddressObject, 'locationDetails'>;

const Address: FC<AddressProps> = ({
  id,
  streetAddress1,
  streetAddress2,
  city,
  state,
  zipCode,
}) => {
  const cityStateZipLine = `${city}, ${state} ${zipCode}`;

  return (
    <Box data-testid={ADDRESS_TEST_IDS.getAddressContainerTestId(id)}>
      <Typography data-testid={ADDRESS_TEST_IDS.getAddressStreetLineTestId(id)}>
        {streetAddress1}
      </Typography>
      {!!streetAddress2 && (
        <Typography
          data-testid={ADDRESS_TEST_IDS.getAddressStreetAddress2LineTestId(id)}
        >
          {streetAddress2}
        </Typography>
      )}
      <Typography
        data-testid={ADDRESS_TEST_IDS.getAddressCityStateZipLineTestId(id)}
      >
        {cityStateZipLine}
      </Typography>
    </Box>
  );
};

export default Address;
