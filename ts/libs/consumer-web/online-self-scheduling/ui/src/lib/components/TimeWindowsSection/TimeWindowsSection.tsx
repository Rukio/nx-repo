import { FC } from 'react';
import { Box, Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import { TimeRangeSelector } from '../TimeRangeSelector';
import { TIME_WINDOWS_SECTION_TEST_IDS } from './testIds';
import { Control } from 'react-hook-form';
import { FormToggleButtonGroup } from '@*company-data-covered*/shared/ui/forms';
import { SelectTimeWindowFieldValues } from '../SelectTimeWindow/SelectTimeWindow';

const makeStyles = () =>
  makeSxStyles({
    fieldNameLabel: { pt: 3, pb: 1, fontWeight: 'bold' },
    timeRangeError: (theme) => ({
      mt: 3,
      color: theme.palette.error.dark,
    }),
  });

export enum AvailabilityDayToggleValue {
  Today = 'Today',
  Tomorrow = 'Tomorrow',
}

export type TimeOptionType = {
  label: string;
  value: string;
};

const toggleButtons = [
  {
    value: AvailabilityDayToggleValue.Today,
    'data-testid': TIME_WINDOWS_SECTION_TEST_IDS.TODAY_TOGGLE,
  },
  {
    value: AvailabilityDayToggleValue.Tomorrow,
    'data-testid': TIME_WINDOWS_SECTION_TEST_IDS.TOMORROW_TOGGLE,
  },
];

export type TimeWindowsSectionProps = {
  startTimeOptions: TimeOptionType[];
  endTimeOptions: TimeOptionType[];
  title: string;
  isTimeRangeErrorShown?: boolean;
  formControl: Control<SelectTimeWindowFieldValues>;
  disableRanges?: boolean;
};

const TimeWindowsSection: FC<TimeWindowsSectionProps> = ({
  startTimeOptions,
  endTimeOptions,
  isTimeRangeErrorShown,
  title,
  formControl,
  disableRanges = false,
}) => {
  const styles = makeStyles();

  return (
    <Box data-testid={TIME_WINDOWS_SECTION_TEST_IDS.CONTAINER}>
      <Typography sx={styles.fieldNameLabel} variant="h6">
        {title}
      </Typography>
      <FormToggleButtonGroup
        control={formControl}
        name="selectedAvailabilityDay"
        toggleButtons={toggleButtons}
        toggleButtonsProps={{
          color: 'primary',
          exclusive: true,
          fullWidth: true,
          size: 'medium',
        }}
      />
      {!disableRanges && (
        <>
          <TimeRangeSelector
            formControl={formControl}
            title="From"
            timeSelectList={startTimeOptions}
            formFieldName="startTime"
            dataTestIdPrefix={
              TIME_WINDOWS_SECTION_TEST_IDS.START_TIME_RANGE_SELECTOR_PREFIX
            }
          />
          <TimeRangeSelector
            formControl={formControl}
            title="To"
            timeSelectList={endTimeOptions}
            formFieldName="endTime"
            dataTestIdPrefix={
              TIME_WINDOWS_SECTION_TEST_IDS.END_TIME_RANGE_SELECTOR_PREFIX
            }
          />
        </>
      )}
      {isTimeRangeErrorShown && (
        <Typography
          sx={styles.timeRangeError}
          variant="body2"
          data-testid={TIME_WINDOWS_SECTION_TEST_IDS.TIME_RANGE_ERROR}
        >
          Please select a minimum 4 hour time window.
        </Typography>
      )}
    </Box>
  );
};

export default TimeWindowsSection;
