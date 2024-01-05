import {
  useGetServiceRequestStatus,
  useGetUser,
  useUpdateServiceRequest,
} from '@*company-data-covered*/caremanager/data-access';
import { ServiceRequestListElement } from '@*company-data-covered*/caremanager/data-access-types';
import {
  calculateAge,
  formattedDOB,
  getAvatarInitials,
  getFullName,
  sexStringToChar,
} from '@*company-data-covered*/caremanager/utils';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FC, useCallback, useMemo, useState } from 'react';
import { MarketChip } from './MarketChip';
import { NotesChip } from './NotesChip';
import RejectServiceRequestDialog from './RejectServiceRequestDialog';
import { VerifiedChip } from './VerifiedChip';

type Props = {
  data: ServiceRequestListElement;
  selected?: boolean;
  onSelect?: () => void;
  'data-testid'?: string;
};

type StatusTransitions = Record<
  string,
  { primary: string; secondary?: string }
>;

const statusTransitions: StatusTransitions = {
  requested: {
    primary: 'clinical_screening',
  },
  clinical_screening: {
    primary: 'accepted',
    secondary: 'secondary_screening',
  },
  secondary_screening: { primary: 'accepted' },
};

const makeStyles = ({ selected, onSelect, data: { serviceRequest } }: Props) =>
  makeSxStyles({
    container: (theme) => ({
      paddingBottom: 1,
      backgroundColor: theme.palette.background.paper,
      borderRadius: 1,
      boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.1)',
      outline: selected ? 'solid' : 'none',
      outlineColor: theme.palette.primary.main,
      outlineWidth: 4,
      marginBottom: 2,
    }),
    selectionContainer: {
      paddingTop: 1,
      '*': {
        cursor: onSelect ? 'pointer' : 'auto',
      },
    },
    section: {
      borderBottomColor: (theme) => theme.palette.divider,
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      paddingX: 2,
      paddingY: 1,
    },
    title: {
      color: (theme) => theme.palette.primary.main,
      marginBottom: 0.5,
    },
    sectionSubtitle: {
      marginBottom: 1,
      marginTop: 0.5,
    },
    sectionText: {
      color: (theme) => theme.palette.text.secondary,
    },
    assignedAvatar: {
      width: 24,
      height: 24,
      fontSize: 12,
    },
    insuranceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    patientDetails: {
      display: 'flex',
      marginBottom: 1,
      'p:not(:last-child):after': {
        content: '"\\2022"',
        marginX: 0.75,
        color: (theme) => theme.palette.text.disabled,
      },
    },
    requestDetails: {
      '> *:not(:last-child)': {
        marginRight: 1,
      },
    },
    chip: {
      borderColor: (theme) => theme.palette.text.disabled,
    },
    actions: {
      paddingX: 2,
      paddingY: 1,
      '> *:not(:last-child)': {
        marginBottom: 1,
      },
    },
    rejectButton: (theme) => ({
      color: theme.palette.error.main,
      borderColor: theme.palette.error.main,
    }),
  });

const getPrimaryActionText = (slug?: string) => {
  switch (slug) {
    case 'requested':
      return 'Clinical Screening';
    case 'accepted':
      return 'Schedule Evaluation Visit';
    default:
      return 'Accept';
  }
};

export const ServiceRequestCard: FC<Props> = (props) => {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const styles = makeStyles(props);
  const {
    onSelect,
    data: { serviceRequest, stationPatient, stationCareRequest, notesCount },
  } = props;

  const { data: statuses } = useGetServiceRequestStatus();
  const { data: assignedUser } = useGetUser(
    serviceRequest?.assignedUserId || ''
  );
  const { mutate: updateServiceRequest, isLoading: isUpdatingServiceRequest } =
    useUpdateServiceRequest();

  const status = useMemo(
    () => statuses?.list.find((v) => v.id === serviceRequest?.statusId),
    [serviceRequest, statuses]
  );

  const primaryActionText = useMemo(
    () => getPrimaryActionText(status?.slug),
    [status?.slug]
  );

  const disableActions = isUpdatingServiceRequest;

  const transitionToStatus = useCallback(
    (order: 'primary' | 'secondary') => () => {
      if (
        disableActions ||
        !serviceRequest ||
        !status ||
        !statusTransitions[status.slug]
      ) {
        return;
      }

      const toStatusSlug = statusTransitions[status.slug][order];
      const toStatus = statuses?.statusMap[toStatusSlug || ''];
      if (!toStatus) {
        return;
      }

      updateServiceRequest({
        serviceRequestId: serviceRequest.id,
        body: {
          statusId: toStatus.id,
        },
      });
    },
    [disableActions, serviceRequest, status, statuses, updateServiceRequest]
  );

  return (
    <Card sx={styles.container} data-testid={props['data-testid']}>
      <Box
        sx={styles.selectionContainer}
        onClick={onSelect}
        data-testid={`selectable-service-request-card-${serviceRequest?.id}`}
      >
        <Box sx={styles.section}>
          <Typography variant="subtitle1" sx={styles.title}>
            {stationPatient?.firstName &&
              stationPatient?.lastName &&
              getFullName({
                firstName: stationPatient.firstName,
                lastName: stationPatient.lastName,
              })}
          </Typography>
          <Box sx={styles.patientDetails}>
            {stationPatient?.ehrId && (
              <Typography variant="body2">
                MRN {stationPatient.ehrId}
              </Typography>
            )}
            {stationPatient?.dateOfBirth && (
              <Typography variant="body2">
                {formattedDOB(stationPatient.dateOfBirth)}
              </Typography>
            )}
            {stationPatient?.dateOfBirth && stationPatient?.sex && (
              <Typography variant="body2">
                {calculateAge(stationPatient.dateOfBirth)}yo{' '}
                {sexStringToChar(stationPatient.sex)}
              </Typography>
            )}
          </Box>
          <Box sx={styles.requestDetails}>
            <MarketChip sx={styles.chip} marketId={serviceRequest?.marketId} />
            {assignedUser && (
              <Chip
                variant="outlined"
                sx={styles.chip}
                label={assignedUser.firstName}
                icon={
                  <Avatar
                    sx={styles.assignedAvatar}
                    src={assignedUser.avatarUrl}
                  >
                    {getAvatarInitials(
                      assignedUser.firstName,
                      assignedUser.lastName
                    )}
                  </Avatar>
                }
              />
            )}
            <NotesChip sx={styles.chip} count={notesCount} />
          </Box>
        </Box>
        <Box sx={styles.section}>
          <Typography variant="subtitle2" sx={styles.sectionSubtitle}>
            Chief Complaint
          </Typography>
          <Typography variant="body2" sx={styles.sectionText}>
            {stationCareRequest?.chiefComplaint || 'None'}
          </Typography>
        </Box>
        <Box sx={styles.section}>
          <Box sx={styles.insuranceHeader}>
            <Typography variant="subtitle2" sx={styles.sectionSubtitle}>
              Insurance
            </Typography>
            {serviceRequest?.isInsuranceVerified !== undefined && (
              <VerifiedChip isVerified={serviceRequest.isInsuranceVerified} />
            )}
          </Box>
          <Typography variant="body2" sx={styles.sectionText}>
            {stationPatient?.insuranceName || 'None'}
          </Typography>
        </Box>
      </Box>
      <Box sx={styles.actions}>
        <Button
          variant="outlined"
          fullWidth
          sx={styles.rejectButton}
          onClick={() => setIsRejectDialogOpen(true)}
        >
          Reject
        </Button>
        {status?.slug && statusTransitions[status.slug]?.secondary && (
          <Button
            variant="outlined"
            fullWidth
            onClick={transitionToStatus('secondary')}
          >
            Secondary Screening
          </Button>
        )}
        <Button
          variant="contained"
          fullWidth
          onClick={transitionToStatus('primary')}
        >
          {primaryActionText}
        </Button>
      </Box>
      <RejectServiceRequestDialog
        open={isRejectDialogOpen}
        serviceRequestId={serviceRequest?.id}
        onClose={() => setIsRejectDialogOpen(false)}
      />
    </Card>
  );
};
