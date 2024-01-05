import { FC, useState } from 'react';
import { differenceInMinutes, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  DirectionsCarIcon,
  Divider,
  Grid,
  PhoneInTalkIcon,
  Stack,
  Theme,
  Typography,
  makeSxStyles,
  useTheme,
} from '@*company-data-covered*/design-system';
import {
  VisitListElement,
  VisitStatusGroup,
} from '@*company-data-covered*/caremanager/data-access-types';
import { useUpdateVisitStatus } from '@*company-data-covered*/caremanager/data-access';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import { MoreOptionsButton } from '@*company-data-covered*/caremanager/ui';
import { UserList } from '../UserList';
import { CallVisitFormModal } from '../CallVisitFormModal';

const makeStyles = (
  theme: Theme,
  isCall: boolean,
  statusGroup: VisitStatusGroup,
  isSchedulingInProcess: boolean | undefined
) => {
  const statusColorMap: Record<VisitStatusGroup, string> = {
    [VisitStatusGroup.Active]: theme.palette.success.main,
    [VisitStatusGroup.Upcoming]: theme.palette.primary.main,
    [VisitStatusGroup.Past]: theme.palette.text.secondary,
    [VisitStatusGroup.Unspecified]: theme.palette.text.secondary,
  };

  const statusColor = statusColorMap[statusGroup];

  return makeSxStyles({
    card: {
      cursor: !isSchedulingInProcess && !isCall ? 'pointer' : 'default',
      padding: {
        xs: '12px 16px',
        sm: '24px 32px',
      },
      borderRadius: 1.5,
      borderLeft: '6px solid',
      borderLeftColor: isSchedulingInProcess
        ? theme.palette.text.disabled
        : statusColor,
    },
    chip: {
      marginLeft: '8px',
      color: isSchedulingInProcess ? theme.palette.text.disabled : statusColor,
      borderColor: isSchedulingInProcess
        ? theme.palette.text.disabled
        : statusColor,
      fontWeight: 400,
      textTransform: 'capitalize',
    },
    alertContainer: {
      maxWidth: 616,
      marginTop: 2,
    },
    alertContainerMessageButton: {
      color: 'error',
      fontSize: '13px',
      letterSpacing: '0.46px',
    },
    alertContainerMesage: {
      fontSize: '14px',
    },
  });
};

const getCareTeamIds = (
  isCall: boolean,
  providerIds?: string[],
  createdByUserId?: string
): string[] | undefined => {
  if (providerIds?.length) {
    return providerIds;
  }

  return isCall && createdByUserId ? [createdByUserId] : undefined;
};

const hasItBeenNMinutesSinceDate = (
  minutes: number,
  startDate: Date
): boolean => {
  return differenceInMinutes(new Date(), startDate) >= minutes;
};

interface Props {
  visit: VisitListElement;
  serviceLineName?: string;
  isEditable?: boolean;
}

export const CALL_VISIT_ICON_TEST_ID = 'call-visit-icon';
export const VISIT_ICON_TEST_ID = 'visit-icon';
export const DISPLAY_DATE_TEST_ID = 'display-date-test-id';

const VisitInfoBar: FC<{
  id: string;
  serviceLineName?: string;
  type?: string;
  isCall?: boolean;
  isSchedulingInProcess?: boolean;
}> = ({ id, serviceLineName, type, isCall, isSchedulingInProcess }) => {
  return (
    <Stack direction="row" spacing={2} mb={0.5}>
      <Stack>
        <Typography
          variant="label"
          letterSpacing={1.5}
          textTransform="uppercase"
          color={isSchedulingInProcess ? 'text.disabled' : 'text.secondary'}
        >
          Visit Id
        </Typography>
        <Typography
          variant="label"
          color={isSchedulingInProcess ? 'text.secondary' : 'text.primary'}
          letterSpacing={0.25}
          fontSize="14px"
        >
          {id}
        </Typography>
      </Stack>
      {!isCall && (
        <Stack>
          <Typography
            variant="label"
            letterSpacing={1.5}
            textTransform="uppercase"
            color={isSchedulingInProcess ? 'text.disabled' : 'text.secondary'}
          >
            Service Line
          </Typography>
          <Typography
            variant="label"
            color={isSchedulingInProcess ? 'text.secondary' : 'text.primary'}
            letterSpacing={0.25}
            fontSize="14px"
            data-testid={`service-line-${id}-${serviceLineName}`}
          >
            {serviceLineName || 'No service Line'}
          </Typography>
        </Stack>
      )}
      {type && (
        <Stack>
          <Typography
            variant="label"
            letterSpacing={1.5}
            textTransform="uppercase"
            color="text.secondary"
          >
            Visit Type
          </Typography>
          <Typography
            variant="label"
            color="text.primary"
            fontSize="14px"
            letterSpacing={0.25}
          >
            {type}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

const DisplayDate: FC<{
  eta?: string;
  createdAt: string;
  statusUpdatedAt?: string;
  status?: string;
  isSchedulingInProcess?: boolean;
}> = ({ eta, createdAt, statusUpdatedAt, status, isSchedulingInProcess }) => {
  const theme = useTheme();
  let displayDate = 'N/A';

  switch (status) {
    case 'on_scene':
    case 'completed':
    case 'billing':
    case 'archived':
    case 'resolved':
      if (statusUpdatedAt) {
        displayDate = `${format(new Date(statusUpdatedAt), 'MMMM do h:mma')}`;
      }
      break;
    case 'requested':
      if (statusUpdatedAt) {
        displayDate = `${format(new Date(statusUpdatedAt), 'MMMM do')}`;
      }
      break;
    case 'accepted':
      if (eta) {
        displayDate = `${format(new Date(eta), 'MMMM do')}`;
      }
      break;
    case 'committed':
    case 'on_route':
      if (eta) {
        displayDate = `${format(new Date(eta), 'MMMM do h:mma')}`;
      }
      break;
    default:
      displayDate = `${format(new Date(createdAt), 'MMMM do h:mma')}`;
      break;
  }

  return (
    <Typography
      variant="h5"
      color={isSchedulingInProcess ? theme.palette.text.disabled : 'primary'}
      data-testid={DISPLAY_DATE_TEST_ID}
    >
      {displayDate}
    </Typography>
  );
};

export const VisitCard: FC<Props> = ({
  visit,
  serviceLineName,
  isEditable,
}) => {
  const {
    id,
    episodeId,
    careRequestId,
    status,
    carName,
    type,
    createdAt,
    summary,
    statusGroup = VisitStatusGroup.Unspecified,
    providerUserIds,
    createdByUserId: createdBy,
    typeId,
    isSchedulingInProcess,
    eta,
    statusUpdatedAt,
  } = visit;
  const navigate = useNavigate();
  const theme = useTheme();
  const isCall = !careRequestId;
  const careTeamIds = getCareTeamIds(isCall, providerUserIds, createdBy);
  const [isEditCallModalOpen, setEditCallModalOpen] = useState(false);

  const { mutateAsync: updateVisitStatus, isLoading: isLoadingCancelVisit } =
    useUpdateVisitStatus(episodeId);

  const { showSuccess, showError } = useSnackbar();

  const handleClick = () =>
    !isCall &&
    !isSchedulingInProcess &&
    navigate(`/episodes/${episodeId}/visits/${id}`);

  const handleRemove = async () => {
    try {
      await updateVisitStatus({
        visitId: id,
        body: {
          status: 'UPDATE_VISIT_STATUS_OPTION_ARCHIVED',
        },
      });

      showSuccess(SNACKBAR_MESSAGES.REMOVED_VISIT);
    } catch (e) {
      await showError(e as Response);
    }
  };

  const styles = makeStyles(theme, isCall, statusGroup, isSchedulingInProcess);

  return (
    <Card
      className="wrapper"
      onClick={handleClick}
      sx={styles.card}
      data-testid={`visit-card-${id}`}
    >
      <Grid
        container
        direction="row"
        alignItems="flex-center"
        justifyContent="space-between"
        flexWrap={{
          lg: 'nowrap',
        }}
      >
        <Box pr={4} flexGrow={1}>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            gap={1}
            mb={1}
          >
            {isCall ? (
              <PhoneInTalkIcon data-testid={CALL_VISIT_ICON_TEST_ID} />
            ) : (
              <DirectionsCarIcon
                data-testid={VISIT_ICON_TEST_ID}
                color={isSchedulingInProcess ? 'disabled' : 'primary'}
              />
            )}
            <DisplayDate
              eta={eta}
              createdAt={createdAt}
              statusUpdatedAt={statusUpdatedAt}
              isSchedulingInProcess={isSchedulingInProcess}
              status={status}
            />
            {isSchedulingInProcess ? (
              <Chip
                label={'Scheduling in Process'}
                variant="outlined"
                sx={styles.chip}
              />
            ) : (
              status && (
                <Chip
                  label={status.replace('_', ' ')}
                  variant="outlined"
                  sx={styles.chip}
                />
              )
            )}
          </Box>
          <VisitInfoBar
            id={id}
            serviceLineName={serviceLineName}
            type={type}
            isCall={isCall}
            isSchedulingInProcess={isSchedulingInProcess}
          />
          {isSchedulingInProcess &&
            hasItBeenNMinutesSinceDate(30, new Date(createdAt)) && (
              <Box sx={styles.alertContainer}>
                <Alert
                  severity="error"
                  message={
                    <Typography sx={styles.alertContainerMesage}>
                      Scheduling has taken longer than expected
                    </Typography>
                  }
                  action={
                    <Box marginRight={'12px'}>
                      <Button
                        color={'error'}
                        variant="outlined"
                        size="small"
                        disabled={isLoadingCancelVisit}
                        onClick={handleRemove}
                      >
                        <Typography sx={styles.alertContainerMessageButton}>
                          Remove from Visits
                        </Typography>
                      </Button>
                    </Box>
                  }
                />
              </Box>
            )}
          {summary && (
            <>
              <Box
                width={120}
                overflow="hidden"
                my={{
                  xs: 1.5,
                  md: 2.25,
                }}
              >
                <Divider />
              </Box>
              <Typography variant="subtitle2" mb={0.5}>
                Visit Summary PA
              </Typography>
              <Typography variant="body2">{summary}</Typography>
            </>
          )}
        </Box>
        <Stack direction="row">
          <Box
            display={{
              xs: 'none',
              md: 'block',
            }}
            pl={{ lg: 3 }}
            mt={{ xs: 4, lg: 0 }}
            borderLeft={{
              lg: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2" mb={1}>
              Care Team{carName ? `: ${carName}` : ''}
            </Typography>
            <Box
              px={{ xs: 0 }}
              py={0.5}
              bgcolor={{
                xs: 'none',
                lg: theme.palette.grey['50'],
              }}
              width={{
                xs: 'inherit',
                lg: 300,
              }}
            >
              {careTeamIds ? (
                <Box px={{ lg: 2 }}>
                  <UserList ids={careTeamIds} />
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color={
                    isSchedulingInProcess
                      ? theme.palette.text.disabled
                      : theme.palette.text.secondary
                  }
                >
                  No care team assigned.
                </Typography>
              )}
            </Box>
          </Box>
          {isCall && isEditable && (
            <Box>
              <MoreOptionsButton
                actions={[
                  {
                    label: 'Edit',
                    handler: () => setEditCallModalOpen(true),
                  },
                ]}
                testIdPrefix="call-visit-card"
              />
            </Box>
          )}
        </Stack>
      </Grid>
      <CallVisitFormModal
        episodeId={episodeId}
        visitId={visit.id}
        isOpen={isEditCallModalOpen}
        onClose={() => setEditCallModalOpen(false)}
        visitTypeId={typeId}
        summary={summary}
      />
    </Card>
  );
};
