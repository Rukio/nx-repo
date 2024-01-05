import { FC, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  Typography,
  Alert,
  theme,
  Box,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  CareRequestParams,
  StatsigActions,
  StatsigEvents,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import {
  useGetServiceAreaAvailabilityQuery,
  selectAddressAvailability,
  selectAddress,
  setAddress,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { AddressInput } from '../components';
import { GoogleAddress, getAddressInfo, StatsigLogEvent } from '../utils';
import { Map } from '@*company-data-covered*/consumer-web/web-request/ui';
import { REQUEST_ADDRESS_TEST_IDS } from './testIds';
import { PageLayout } from '../components/PageLayout';
import dayjs from 'dayjs';

type CareRequestStreetAdress = Pick<
  CareRequestParams['address'],
  'streetAddress1' | 'streetAddress2'
>;

type AddressWithStreet = GoogleAddress & Partial<CareRequestStreetAdress>;

const LOG_EVENT: StatsigLogEvent = {
  eventName: StatsigEvents.REQUEST_ADDRESS_EVENT,
  value: StatsigActions.ADDED_ADDRESS,
  metadata: {
    page: StatsigPageCategory.REQUEST_ADDRESS,
    origin: window.location.host,
  },
};

const makeStyles = () =>
  makeSxStyles({
    mapContainer: {
      width: '100%',
      height: 160,
      borderRadius: theme.spacing(1),
      marginTop: theme.spacing(1.5),
      overflow: 'hidden',
    },
  });

const RequestAddress: FC = () => {
  const dispatch = useAppDispatch();
  const styles = makeStyles();
  const [address, changeAddress] = useState<AddressWithStreet | null>(null);

  const requestAddress = useSelector(selectAddress);

  const initialAddress = useMemo(() => {
    if (!requestAddress.postalCode) {
      return '';
    }

    return `${requestAddress.streetAddress1}, ${requestAddress.city}, ${requestAddress.state}`;
    // We only need to set initialAddress first time on redux rehydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientTime = useMemo(() => dayjs().format('H:mm:ssZZ'), []);

  const availabilityPayload = address?.postalCode
    ? {
        zipcode: address.postalCode,
        clientTime: clientTime,
      }
    : skipToken;

  useGetServiceAreaAvailabilityQuery(availabilityPayload, {
    refetchOnMountOrArgChange: true,
  });

  const {
    isAddressAvailabilityError,
    isAddressAvailabilityClosed,
    isAddressAvailabilityOpen,
  } = useSelector(selectAddressAvailability(availabilityPayload));

  useEffect(() => {
    if (initialAddress) {
      getAddressInfo(initialAddress).then(({ coordinates }) => {
        changeAddress({ ...requestAddress, ...coordinates });
      });
    }
    // We only need to get local storage address info first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapMarker = useMemo(() => {
    if (isAddressAvailabilityOpen && address?.lat && address?.lng) {
      return { lat: address.lat, lng: address.lng };
    }

    return undefined;
  }, [address, isAddressAvailabilityOpen]);

  const onSubmitAddress = () => {
    if (address) {
      dispatch(
        setAddress({
          streetAddress1:
            address.streetAddress1 ??
            `${address.streetNumber} ${address.streetName}`,
          streetAddress2: address.streetAddress2 ?? address.addressLine2 ?? '',
          city: address.city || '',
          state: address.state || '',
          postalCode: address.postalCode || '',
        })
      );
    }
  };

  const shouldReturnHome = isAddressAvailabilityClosed;

  return (
    <PageLayout
      continueOptions={{
        disabled: !isAddressAvailabilityOpen,
        dataTestId: shouldReturnHome
          ? REQUEST_ADDRESS_TEST_IDS.RETURN_HOME_BUTTON
          : REQUEST_ADDRESS_TEST_IDS.LOCATION_CONTINUE_BUTTON,
        shouldReturnHome,
        showBtn: !isAddressAvailabilityError,
        logEventData: LOG_EVENT,
        onClick: onSubmitAddress,
      }}
      titleOptions={{
        dataTestId: REQUEST_ADDRESS_TEST_IDS.LOCATION_HEADER,
        text: 'Where do you need us to go?',
      }}
    >
      <>
        <Typography
          sx={{ mt: 3 }}
          variant="body2"
          data-testid={REQUEST_ADDRESS_TEST_IDS.LOCATION_CONFIRM_MESSAGE}
        >
          Let’s confirm that we can come to your location.
        </Typography>
        <AddressInput
          setAddress={changeAddress}
          initialValue={initialAddress}
        />
        {isAddressAvailabilityOpen && mapMarker && (
          <>
            <Box
              sx={styles.mapContainer}
              data-testid={REQUEST_ADDRESS_TEST_IDS.GOOGLE_MAP_CONTAINER}
            >
              <Map center={mapMarker} />
            </Box>
            <Alert
              data-testid={REQUEST_ADDRESS_TEST_IDS.IN_SERVICE_MESSAGE}
              message="Great news! You're in our service area."
              sx={{ mt: 1.5 }}
            />
          </>
        )}
        {isAddressAvailabilityError && (
          <Alert
            message="Please visit your local urgent care. If this is an emergency, dial 911."
            title="Sorry! We’re not available in your area yet."
            severity="error"
            sx={{ mt: 1.5 }}
            data-testid={REQUEST_ADDRESS_TEST_IDS.OUT_OF_AREA_MESSAGE}
          />
        )}
        {isAddressAvailabilityClosed && (
          <Alert
            severity="error"
            title="Sorry! We're closed at the moment."
            sx={{ mt: 1.5 }}
            message="If this is an emergency, dial 911."
            data-testid={REQUEST_ADDRESS_TEST_IDS.MARKET_CLOSED_MESSAGE}
          />
        )}
        {isAddressAvailabilityOpen && (
          <Alert
            message="Only a few appointments left today!"
            severity="warning"
            sx={{ mt: 1.5 }}
            data-testid={REQUEST_ADDRESS_TEST_IDS.LIMITED_APPOINTMENT_WARNING}
          />
        )}
      </>
    </PageLayout>
  );
};

export default RequestAddress;
