import {
  Market,
  UnableToScheduleReason,
} from '@*company-data-covered*/caremanager/data-access-types';
import { useFormikContext } from 'formik';
import { useState } from 'react';
import { PatientAvailabilityFormSchema } from '../../SchedulingModal';
import {
  useCanScheduleVisit,
  useGetVisitAvailability,
} from '@*company-data-covered*/caremanager/data-access';
import { formatInTimeZone } from 'date-fns-tz';
import { addDays, getUnixTime } from 'date-fns';
import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  Grid,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { PatientLike, getFullName } from '@*company-data-covered*/caremanager/utils';
import AvailabilityInputs from '../AvailabilityInputs';
import {
  CheckAvailabilityLoadingState,
  SchedulingFormLoadingState,
} from '../LoadingStates';
import { testIds } from '../../SchedulingModal.testids';
import SchedulingError from '../SchedulingError/SchedulingError';
import { isPatientAvailabilitayWindowValid } from '../../date-utils';

const styles = makeSxStyles({
  formGrid: {
    paddingBottom: '40px',
  },
  patientInformationStack: {
    backgroundColor: (theme) => theme.palette.background.default,
    padding: '16px',
  },
  checkAvailabilityLoadingStateContainer: {
    marginTop: '16px',
  },
  submitButtonLoadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    height: '2em',
    width: '6em',
  },
});

interface Props {
  careRequestId?: string;
  formSubmitted: boolean;
  isCancelingVisit: boolean;
  isSchedulingVisit: boolean;
  market: Market;
  patient: PatientLike & { addressStreet?: string };
  onClose: () => void;
  serviceLineId: string;
}

const SchedulingFormContent: React.FC<Props> = ({
  careRequestId,
  isCancelingVisit,
  isSchedulingVisit,
  market,
  patient,
  onClose,
  serviceLineId,
}) => {
  const [isVisitSchedulable, setIsVisitSchedulable] = useState(false);
  const [unableToScheduleReason, setUnableToScheduleReason] =
    useState<UnableToScheduleReason>();
  const {
    isValid: isFormValid,
    isValidating: isFormValidating,
    isSubmitting: isFormSubmitting,
    values: formValues,
  } = useFormikContext<PatientAvailabilityFormSchema>();
  const {
    mutateAsync: canScheduleVisit,
    isLoading: isLoadingCanScheduleVisit,
  } = useCanScheduleVisit();

  const availabilityDatesToRequest = (() => {
    const datesToRequestAvailability = [];

    // Generate dates for the next 5 calendar days
    for (let i = 0; i < 5; i += 1) {
      datesToRequestAvailability.push(
        formatInTimeZone(addDays(new Date(), i), market.tzName, 'MM-dd-yyyy')
      );
    }

    return datesToRequestAvailability;
  })();

  const { data: visitAvailabilityData } = useGetVisitAvailability({
    body: {
      careRequestId: careRequestId ?? '',
      requestedDates: availabilityDatesToRequest,
    },
  });

  const handlePatientAvailabilityChange = async () => {
    const patientAvailabilitayWindowValid = isPatientAvailabilitayWindowValid(
      formValues.startTime,
      formValues.endTime
    );

    if (patientAvailabilitayWindowValid) {
      setUnableToScheduleReason(undefined);
      const response = await canScheduleVisit({
        body: {
          careRequestId: `${careRequestId}`,
          patientAvailabilityStartTime: `${getUnixTime(
            new Date(formValues.startTime)
          )}`,
          patientAvailabilityEndTime: `${getUnixTime(
            new Date(formValues.endTime)
          )}`,
        },
      });

      setIsVisitSchedulable(response.canScheduleVisit);
      setUnableToScheduleReason(
        !response.canScheduleVisit
          ? response.reason ?? UnableToScheduleReason.Unspecified
          : undefined
      );
    } else {
      setIsVisitSchedulable(false);
    }
  };

  const isFormSubmittable =
    isVisitSchedulable &&
    isFormValid &&
    !isCancelingVisit &&
    !isFormValidating &&
    !isFormSubmitting &&
    !isLoadingCanScheduleVisit &&
    !isSchedulingVisit;

  const isFormCancelable =
    !isCancelingVisit && careRequestId && !isSchedulingVisit;

  return (
    <>
      <DialogContent>
        <Grid container spacing={2} sx={styles.formGrid}>
          <Grid item xs={4}>
            <Stack spacing={2} sx={styles.patientInformationStack}>
              <Box>
                <Typography variant="subtitle2">Patient Name</Typography>
                <Typography
                  data-testid={testIds.PATIENT_SCHEDULE_VISIT_NAME}
                  variant="body2"
                >
                  {getFullName(patient)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Address</Typography>
                <Typography
                  data-testid={testIds.PATIENT_SCHEDULE_VISIT_ADDRESS}
                  variant="body2"
                >
                  {patient.addressStreet}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Service Line</Typography>
                <Typography
                  data-testid={testIds.PATIENT_SCHEDULE_VISIT_SERVICE_LINE}
                  variant="body2"
                >
                  {serviceLineId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">CR ID</Typography>
                <Typography
                  data-testid={testIds.PATIENT_SCHEDULE_VISIT_CR_ID}
                  variant="body2"
                >
                  {careRequestId ?? '--'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={8}>
            {(!careRequestId || (careRequestId && !visitAvailabilityData)) && (
              <SchedulingFormLoadingState />
            )}
            {careRequestId && visitAvailabilityData && (
              <AvailabilityInputs
                disabled={isLoadingCanScheduleVisit || isSchedulingVisit}
                market={market}
                onPatientAvailabilityChange={handlePatientAvailabilityChange}
                visitAvailability={visitAvailabilityData.availability || []}
              />
            )}
            {isLoadingCanScheduleVisit && (
              <Box sx={styles.checkAvailabilityLoadingStateContainer}>
                <CheckAvailabilityLoadingState />
              </Box>
            )}
            {unableToScheduleReason && (
              <SchedulingError reason={unableToScheduleReason} />
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          data-testid={testIds.CANCEL_BUTTON}
          onClick={onClose}
          disabled={!isFormCancelable}
        >
          Cancel
        </Button>
        <Button
          data-testid={testIds.SUBMIT_BUTTON}
          type="submit"
          variant="contained"
          disabled={!isFormSubmittable}
          disableElevation
        >
          {isSchedulingVisit ? (
            <Box sx={styles.submitButtonLoadingState}>
              <CircularProgress color="inherit" size={20} />
            </Box>
          ) : (
            'Schedule Visit'
          )}
        </Button>
      </DialogActions>
    </>
  );
};

export default SchedulingFormContent;
