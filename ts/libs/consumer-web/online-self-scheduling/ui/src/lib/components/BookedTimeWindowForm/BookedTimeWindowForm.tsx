import { FC } from 'react';
import { Control } from 'react-hook-form';
import {
  Box,
  makeSxStyles,
  Alert,
  AccessTimeIcon,
  alertClasses,
} from '@*company-data-covered*/design-system';
import { FormFooter } from '../FormFooter';
import {
  TimeWindowsSection,
  TimeOptionType,
  AvailabilityDayToggleValue,
} from '../TimeWindowsSection';
import { BOOKED_TIME_WINDOW_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    formFooter: { pt: 3 },
    openTimeTomorrow: (theme) => ({
      pl: 1,
      [`& .${alertClasses.message}`]: {
        color: theme.palette.info.main,
      },
    }),
    availabilityAlert: {
      mt: 3,
    },
  });

export type BookedTimeWindowFormFieldValues = {
  startTime: string;
  endTime: string;
  selectedAvailabilityDay: AvailabilityDayToggleValue;
};

export type BookedTimeWindowFormProps = {
  startTimeOptions: TimeOptionType[];
  endTimeOptions: TimeOptionType[];
  isSubmitButtonDisabled?: boolean;
  timeWindowSectionTitle: string;
  openTimeAlertMessage: string;
  isTimeRangeErrorShown?: boolean;
  formControl: Control<BookedTimeWindowFormFieldValues>;
  onSubmit: () => void;
  isSelectedTimeAvailabilityAlert?: boolean;
  marketAvailabilityAlertText: string;
  disableRanges?: boolean;
};

export const BookedTimeWindowForm: FC<BookedTimeWindowFormProps> = ({
  startTimeOptions,
  endTimeOptions,
  isSubmitButtonDisabled,
  timeWindowSectionTitle,
  isTimeRangeErrorShown,
  formControl,
  openTimeAlertMessage,
  onSubmit,
  marketAvailabilityAlertText,
  isSelectedTimeAvailabilityAlert = false,
  disableRanges,
}) => {
  const styles = makeStyles();

  return (
    <>
      <Alert
        severity="error"
        message={marketAvailabilityAlertText}
        data-testid={BOOKED_TIME_WINDOW_TEST_IDS.ALERT}
      />
      <Alert
        sx={styles.openTimeTomorrow}
        icon={<AccessTimeIcon />}
        variant="outlined"
        severity="info"
        message={openTimeAlertMessage}
        data-testid={BOOKED_TIME_WINDOW_TEST_IDS.OPEN_TIME}
      />
      <TimeWindowsSection
        formControl={formControl}
        startTimeOptions={startTimeOptions}
        endTimeOptions={endTimeOptions}
        isTimeRangeErrorShown={isTimeRangeErrorShown}
        title={timeWindowSectionTitle}
        disableRanges={disableRanges}
      />
      {isSelectedTimeAvailabilityAlert && (
        <Alert
          data-testid={
            BOOKED_TIME_WINDOW_TEST_IDS.SELECTED_TIME_AVAILABILITY_ALERT
          }
          sx={styles.availabilityAlert}
          severity="warning"
          message="This time window is not available. Please select another time."
        />
      )}
      <Box sx={styles.formFooter}>
        <FormFooter
          onSubmit={onSubmit}
          isSubmitButtonDisabled={isSubmitButtonDisabled}
          submitButtonLabel="Confirm and Schedule Appointment"
        />
      </Box>
    </>
  );
};
