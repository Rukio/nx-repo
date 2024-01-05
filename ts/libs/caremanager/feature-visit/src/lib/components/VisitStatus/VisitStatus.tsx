import { FC, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Box,
  Button,
  CircularProgress,
  Theme,
  Typography,
  makeSxStyles,
  useTheme,
} from '@*company-data-covered*/design-system';
import {
  useGetAddresses,
  useGetUsers,
  useUpdateVisitStatus,
} from '@*company-data-covered*/caremanager/data-access';
import {
  CaremanagerAddress as Address,
  UpdateVisitStatusOption,
  Visit,
} from '@*company-data-covered*/caremanager/data-access-types';
import { environment } from '../../environments/environment';
import { UserList } from '../UserList';

const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/';

const styles = makeSxStyles({
  container: (theme) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: 1,
    borderColor: theme.palette.primary.main,
    borderStyle: 'solid',
    borderWidth: 2,
    overflow: 'hidden',
  }),
  detailsContainer: {
    paddingX: 3,
    paddingTop: 2,
    paddingBottom: 4,
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
  },
  titleRowContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  actionContainer: (theme) => ({
    backgroundColor: theme.palette.grey[50],
    borderTopColor: theme.palette.divider,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    padding: 3,
    paddingTop: 2,
  }),
  addressLink: (theme) => ({
    color: theme.palette.primary.main,
    textDecoration: 'underline',
    marginBottom: 0.5,
  }),
  statusLed: {
    width: 12,
    height: 12,
    borderRadius: '100%',
  },
});

interface Props {
  visit: Visit;
  timezone?: string;
}

type Configuration = {
  cardTitle: string;
  tint: string;
  showAction: boolean;
  buttonDisabled: boolean;
  linkToDashboard: boolean;
  buttonText?: string;
  actionPrompt?: string;
  updateToStatus?: UpdateVisitStatusOption;
};

export const getConfiguration = (
  theme: Theme,
  status?: string
): Configuration => {
  const defaultOptions = {
    showAction: true,
    buttonDisabled: false,
    tint: theme.palette.primary.main,
    linkToDashboard: false,
  };

  switch (status) {
    // show scheduled with greyed out button
    case 'requested':
      return {
        ...defaultOptions,
        cardTitle: 'Scheduled',
        actionPrompt:
          'The care request will be enabled when it is up next in schedule',
        buttonText: `Mark As Committed`,
        buttonDisabled: true,
      };
    // show scheduled with option to commit, or same as requested if feature flag is off
    case 'accepted':
      return {
        ...defaultOptions,
        cardTitle: 'Scheduled',
        actionPrompt: 'Tap to commit visit to an available care team',
        buttonText: 'Mark As Committed',
        updateToStatus: UpdateVisitStatusOption.Committed,
      };
    // show scheduled with update to on route
    case 'committed':
      return {
        ...defaultOptions,
        cardTitle: 'Scheduled',
        actionPrompt: 'Tap to signal you are on your way to see the patient',
        buttonText: 'Mark As En Route',
        updateToStatus: UpdateVisitStatusOption.OnRoute,
      };
    // show on route with update to on scene
    case 'on_route':
      return {
        ...defaultOptions,
        cardTitle: 'En Route',
        actionPrompt: 'Tap to signal you have arrived with the patient',
        buttonText: 'Mark As On Scene',
        updateToStatus: UpdateVisitStatusOption.OnScene,
      };
    // show on scene with update to complete
    case 'on_scene':
      return {
        ...defaultOptions,
        cardTitle: 'On Scene',
        actionPrompt: 'Tap to signal you have completed the care request',
        buttonText: 'Resolve Case',
        updateToStatus: UpdateVisitStatusOption.Archived,
        tint: theme.palette.success.dark,
      };
    // show resolved with no action options
    case 'complete':
    case 'archived':
    case undefined:
      return {
        ...defaultOptions,
        cardTitle: 'Resolved',
        tint: theme.palette.grey[400],
        showAction: false,
      };
    // show needs action with link to dashboard, yellow tinted
    default:
      return {
        ...defaultOptions,
        cardTitle: 'Needs Action',
        tint: theme.palette.warning.main,
        actionPrompt: 'Tap to view the care request in Dashboard',
        buttonText: 'Go to Dashboard',
        linkToDashboard: true,
      };
  }
};

const getPatientAvailability = (
  timezone: string,
  start?: string,
  end?: string
): string => {
  if (!start || !end) {
    return 'No patient availability found.';
  }
  const startFormatted = formatInTimeZone(new Date(start), timezone, 'p');
  const endFormatted = formatInTimeZone(new Date(end), timezone, 'p zzz');

  return `${startFormatted} - ${endFormatted}`;
};

export const getMapURL = (address?: Address) => {
  if (!address) {
    return '';
  }

  const mapQueryComponents =
    address.latitude && address.longitude
      ? [address.latitude.toString(), address.longitude.toString()]
      : [
          address.streetAddress1,
          address.streetAddress2,
          address.city,
          address.state,
          address.zipcode,
        ].filter((component) => !!component);

  const mapQuery = encodeURIComponent(mapQueryComponents.join(','));

  return `${GOOGLE_MAPS_SEARCH_URL}?api=1&query=${mapQuery}`;
};

export const VisitStatus: FC<Props> = ({
  visit: {
    id: visitId,
    status,
    addressId,
    careRequestId,
    patientAvailabilityStart,
    patientAvailabilityEnd,
    providerUserIds,
    carName,
  },
  timezone = 'America/Denver',
}) => {
  const theme = useTheme();
  const hasProviderIds = !!providerUserIds?.length;
  const hasAddressId = !!addressId;
  const {
    isLoading: isLoadingAddress,
    data: addressData,
    error: addressError,
  } = useGetAddresses(hasAddressId ? [addressId] : undefined);
  useGetUsers(providerUserIds);

  const { isLoading: isUpdatingVisitStatus, mutate: updateVisitStatus } =
    useUpdateVisitStatus();

  const address = addressData?.addresses[0];

  const {
    cardTitle,
    tint,
    showAction,
    actionPrompt,
    buttonDisabled,
    buttonText,
    linkToDashboard,
    updateToStatus,
  } = useMemo(() => getConfiguration(theme, status), [theme, status]);

  const patientAvailability = useMemo(
    () =>
      getPatientAvailability(
        timezone,
        patientAvailabilityStart,
        patientAvailabilityEnd
      ),
    [timezone, patientAvailabilityStart, patientAvailabilityEnd]
  );

  const mapURL = useMemo(() => getMapURL(address), [address]);

  const handleAction = () => {
    if (updateToStatus) {
      updateVisitStatus({
        visitId,
        body: { status: updateToStatus },
      });
    } else if (linkToDashboard && careRequestId) {
      window.open(environment.appStationUrl, '_blank');
    }
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.detailsContainer}>
        <Box sx={styles.titleRowContainer}>
          <Box sx={styles.titleContainer}>
            <Box sx={{ ...styles.statusLed, backgroundColor: tint }} />
            <Typography data-testid="visit-status-title" variant="h5">
              {cardTitle}
            </Typography>
          </Box>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            CR {careRequestId}
          </Typography>
        </Box>
        <Box marginBottom={3}>
          <Typography variant="subtitle2" marginBottom={0.75}>
            Location
          </Typography>
          {!hasAddressId && (
            <Typography variant="body2">No address has been set</Typography>
          )}
          {isLoadingAddress && <CircularProgress />}
          {address && (
            <>
              <Link
                to={mapURL}
                target="_blank"
                data-testid="visit-status-map-link"
              >
                <Box sx={styles.addressLink}>
                  {address.streetAddress1 && (
                    <Typography variant="body2">
                      {address.streetAddress1}
                    </Typography>
                  )}
                  {address.streetAddress2 && (
                    <Typography variant="body2">
                      {address.streetAddress2}
                    </Typography>
                  )}
                  <Typography variant="body2">{`${address.city}, ${address.state} ${address.zipcode}`}</Typography>
                </Box>
              </Link>
              {address.additionalDetails && (
                <Typography
                  variant="body2"
                  color={theme.palette.text.secondary}
                >
                  {address.additionalDetails}
                </Typography>
              )}
            </>
          )}
          {!!addressError && (
            <Typography variant="body2" color={theme.palette.error.main}>
              The address could not be loaded.
            </Typography>
          )}
        </Box>
        <Box marginBottom={2}>
          <Typography variant="subtitle2" marginBottom={0.75}>
            Patient Availability
          </Typography>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            {patientAvailability}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" marginBottom={0.75}>
            Care Team{carName ? `: ${carName}` : ''}
          </Typography>
          {hasProviderIds ? (
            <UserList ids={providerUserIds} />
          ) : (
            <Typography variant="body2" color={theme.palette.text.secondary}>
              No care team assigned.
            </Typography>
          )}
        </Box>
      </Box>
      {showAction && (
        <Box sx={styles.actionContainer}>
          <Typography
            variant="body2"
            color={theme.palette.text.secondary}
            marginBottom={2}
          >
            {actionPrompt}
          </Typography>
          {isUpdatingVisitStatus ? (
            <Box textAlign="center">
              <CircularProgress />
            </Box>
          ) : (
            <Button
              variant="contained"
              size="large"
              color={linkToDashboard ? 'warning' : 'primary'}
              fullWidth
              onClick={handleAction}
              disabled={buttonDisabled}
              data-testid="visit-status-update-button"
            >
              {buttonText}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};
