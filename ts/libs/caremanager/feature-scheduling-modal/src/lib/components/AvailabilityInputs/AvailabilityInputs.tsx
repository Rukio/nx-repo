import { useMemo } from 'react';
import {
  addDays,
  addHours,
  addMinutes,
  eachMinuteOfInterval,
  format,
} from 'date-fns';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { useFormikContext } from 'formik';
import {
  GetVisitAvailabilityResponse,
  Market,
} from '@*company-data-covered*/caremanager/data-access-types';
import { Box, Stack, Typography, theme } from '@*company-data-covered*/design-system';
import { FormikSelectField } from '@*company-data-covered*/caremanager/ui';
import { PatientAvailabilityFormSchema } from '../../SchedulingModal';
import { testIds } from '../../SchedulingModal.testids';

const AVAILABILITY_SLOT_DURATION_MINUTES = 30;

const getAvailabilityOptions = (
  market: Market,
  selectedDate: string,
  dateOptions: { isAvailable: boolean; isToday: boolean }
) => {
  if (!dateOptions.isAvailable) {
    return [];
  }

  // Replace the date separation hyphens ('-') with slashes ('/')
  // since Safari does not support the MM-dd-yyyy format.
  const sanitizedDate = selectedDate.replaceAll(/-/g, '/');
  const startOfDaySelectedDateInUTC = zonedTimeToUtc(
    new Date(`${sanitizedDate} 00:00:00`),
    market.tzName
  );

  const localDayOfWeek = Number.parseInt(
    format(utcToZonedTime(startOfDaySelectedDateInUTC, market.tzName), 'e')
  );

  const marketScheduleForSelectedDate = market.scheduleDays[localDayOfWeek - 1];

  const marketOpenDatetime = addHours(
    addMinutes(
      startOfDaySelectedDateInUTC,
      marketScheduleForSelectedDate.openTime?.minutes || 0
    ),
    marketScheduleForSelectedDate.openTime?.hours || 0
  );
  const marketCloseDatetime = addHours(
    addMinutes(
      startOfDaySelectedDateInUTC,
      marketScheduleForSelectedDate.closeTime?.minutes || 0
    ),
    marketScheduleForSelectedDate.closeTime?.hours || 0
  );

  const halfHourSlots = eachMinuteOfInterval(
    {
      start: marketOpenDatetime,
      end: marketCloseDatetime,
    },
    {
      step: AVAILABILITY_SLOT_DURATION_MINUTES,
    }
  );

  return halfHourSlots
    .filter((slot) => {
      return dateOptions.isToday ? slot.getTime() >= Date.now() : true;
    })
    .map((slot) => ({
      id: slot.toISOString(),
      name: formatInTimeZone(slot, market.tzName, 'p'),
    }));
};

interface Props {
  disabled: boolean;
  market: Market;
  onPatientAvailabilityChange: () => void;
  visitAvailability: NonNullable<GetVisitAvailabilityResponse['availability']>;
}

const AvailabilityInputs: React.FC<Props> = ({
  disabled = false,
  market,
  onPatientAvailabilityChange,
  visitAvailability,
}) => {
  const { setFieldValue, values: formValues } =
    useFormikContext<PatientAvailabilityFormSchema>();

  const dateAvailabilityOptions = visitAvailability.map((day, index) => {
    let displayName =
      index === 0
        ? 'Today'
        : formatInTimeZone(
            addDays(new Date(), index),
            market.tzName,
            'LLLL d, Y'
          );
    displayName = `${displayName} - ${
      day.isAvailable ? 'Available' : 'Unavailable'
    }`;

    return {
      id: day.date || '',
      name: displayName,
      date: day.date,
      isAvailable: day.isAvailable,
    };
  });

  const patientAvailabilityOptions = useMemo(
    () =>
      getAvailabilityOptions(market, formValues.date, {
        isToday: formValues.date === visitAvailability[0].date,
        isAvailable:
          dateAvailabilityOptions.find((date) => date.date === formValues.date)
            ?.isAvailable ?? false,
      }),
    [dateAvailabilityOptions, market, formValues.date, visitAvailability]
  );

  const handleDateOptionChanged = () => {
    setFieldValue('startTime', '');
    setFieldValue('endTime', '');
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2">Patient Availability</Typography>
        <Typography variant="caption">4 hour minimum window</Typography>
      </Box>
      <Box data-testid={testIds.DATE_DROPDOWN}>
        <FormikSelectField
          disabled={disabled}
          onBlur={handleDateOptionChanged}
          options={dateAvailabilityOptions}
          label="Date"
          name="date"
          customRender={(itemName) => {
            const nameComponents = itemName.split(' - ');
            const color =
              nameComponents[1] === 'Available'
                ? theme.palette.success.main
                : theme.palette.error.main;

            return (
              <>
                <span style={{ marginRight: '4px' }}>
                  {nameComponents[0]}
                  {' -'}
                </span>
                <span style={{ color }}>{nameComponents[1]}</span>
              </>
            );
          }}
          fullWidth
        />
      </Box>
      <Box data-testid={testIds.AVAILABILITY_START_TIME_DROPDOWN}>
        <FormikSelectField
          disabled={disabled || !patientAvailabilityOptions.length}
          onBlur={onPatientAvailabilityChange}
          options={patientAvailabilityOptions}
          label="Start Time"
          name="startTime"
          fullWidth
        />
      </Box>
      <Box data-testid={testIds.AVAILABILITY_END_TIME_DROPDOWN}>
        <FormikSelectField
          disabled={disabled || !patientAvailabilityOptions.length}
          onBlur={onPatientAvailabilityChange}
          options={patientAvailabilityOptions}
          label="End Time"
          name="endTime"
          fullWidth
        />
      </Box>
    </Stack>
  );
};

export default AvailabilityInputs;
