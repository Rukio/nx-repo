import { FC, MouseEvent } from 'react';
import {
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  colorManipulator,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { PatientPreferredEta } from '@*company-data-covered*/consumer-web-types';
import { SessionStorageKeys } from '../../constants';
import { PREFERRED_TIME_WINDOWS_TEST_IDS } from './testIds';
import {
  DaysEnum,
  getTomorrowDate,
  TimePeriod,
  getTimePeriod,
  isSameTime,
  isFutureDate,
  getMonthDayFormattedDate,
} from '../../utils';

export interface PreferredTimeWindowsProps {
  isFutureEta: boolean;
  requestPreferredEta: PatientPreferredEta | undefined;
  onChangeRequestPreferredEta: (option: {
    patientPreferredEtaStart: Date;
    patientPreferredEtaEnd: Date;
  }) => void;
}

const makeStyles = () =>
  makeSxStyles({
    toggleButtonGroup: {
      '& .MuiToggleButtonGroup-grouped': {
        my: 1.5,

        '&:not(:first-of-type), &:first-of-type': {
          borderRadius: 1,
          border: 1,
        },

        '&.Mui-selected, &.Mui-selected:hover': (theme) => ({
          backgroundColor: colorManipulator.alpha(
            theme.palette.primary.main,
            0.08
          ),
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
        }),
      },
    },
  });

interface TimeOption {
  title: string;
  start: Date;
  end: Date;
}

interface DayOption {
  day: DaysEnum;
  time: TimeOption;
}

const getPreferredEta = (dayOption: DayOption) => {
  if (dayOption.day === DaysEnum.tomorrow) {
    return {
      patientPreferredEtaStart: getTomorrowDate(dayOption.time.start),
      patientPreferredEtaEnd: getTomorrowDate(dayOption.time.end),
    };
  }

  return {
    patientPreferredEtaStart: dayOption.time.start,
    patientPreferredEtaEnd: dayOption.time.end,
  };
};

const PreferredTimeWindows: FC<PreferredTimeWindowsProps> = ({
  isFutureEta,
  requestPreferredEta,
  onChangeRequestPreferredEta,
}) => {
  const timeOptions = {
    morning: {
      title: `${TimePeriod.Morning} (7am-12pm)`,
      ...getTimePeriod(TimePeriod.Morning),
    },
    afternoon: {
      title: `${TimePeriod.Afternoon} (12-5pm)`,
      ...getTimePeriod(TimePeriod.Afternoon),
    },
    evening: {
      title: `${TimePeriod.Evening} (5-10pm)`,
      ...getTimePeriod(TimePeriod.Evening),
    },
  };

  const todayOptions: DayOption[] = [
    { day: DaysEnum.today, time: timeOptions.morning },
    { day: DaysEnum.today, time: timeOptions.afternoon },
    { day: DaysEnum.today, time: timeOptions.evening },
  ];

  const tomorrowOptions: DayOption[] = [
    { day: DaysEnum.tomorrow, time: timeOptions.morning },
    { day: DaysEnum.tomorrow, time: timeOptions.afternoon },
    { day: DaysEnum.tomorrow, time: timeOptions.evening },
  ];

  const onChangeRequestFor = (_event: MouseEvent, value: DayOption) => {
    const option = getPreferredEta(value);
    const isSameOptionSelected =
      isSameTime(
        requestPreferredEta?.patientPreferredEtaStart,
        option.patientPreferredEtaStart
      ) &&
      isSameTime(
        requestPreferredEta?.patientPreferredEtaEnd,
        option.patientPreferredEtaEnd
      );

    if (isSameOptionSelected) {
      return;
    }

    onChangeRequestPreferredEta(option);
    window.sessionStorage.setItem(
      SessionStorageKeys.PreferredEtaStart,
      option.patientPreferredEtaStart.toString()
    );
  };

  const renderTimeOptions = (options: DayOption[], showTomorrow?: boolean) => {
    const styles = makeStyles();

    return (
      <ToggleButtonGroup
        exclusive
        orientation="vertical"
        fullWidth
        data-testid={PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsGroupTestId(
          options[0].day
        )}
        onChange={onChangeRequestFor}
        sx={styles.toggleButtonGroup}
      >
        {options.map((option) => {
          const startTimeOption = showTomorrow
            ? getTomorrowDate(option.time.start)
            : option.time.start;
          const endTimeOption = showTomorrow
            ? getTomorrowDate(option.time.end)
            : option.time.end;

          return (
            <ToggleButton
              key={`${option.day}-${option.time.title}`}
              selected={
                isFutureEta &&
                isSameTime(
                  requestPreferredEta?.patientPreferredEtaStart,
                  startTimeOption
                ) &&
                isSameTime(
                  requestPreferredEta?.patientPreferredEtaEnd,
                  endTimeOption
                )
              }
              value={option}
              disabled={!isFutureDate(endTimeOption)}
            >
              {option.time.title}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    );
  };

  return (
    <>
      <Alert
        severity="warning"
        message="Appointments are booking fast! Select your preferred time window for a visit."
        data-testid={PREFERRED_TIME_WINDOWS_TEST_IDS.ALERT}
        sx={{ mt: 3 }}
      />
      <Typography
        variant="h5"
        sx={{ mt: 3 }}
        data-testid={PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsHeaderTestId(
          DaysEnum.today
        )}
      >
        Today ({getMonthDayFormattedDate(new Date())})
      </Typography>
      {renderTimeOptions(todayOptions)}
      <Typography
        variant="h5"
        sx={{ mt: 4 }}
        data-testid={PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsHeaderTestId(
          DaysEnum.tomorrow
        )}
      >
        Tomorrow ({getMonthDayFormattedDate(getTomorrowDate())})
      </Typography>
      {renderTimeOptions(tomorrowOptions, true)}
    </>
  );
};

export default PreferredTimeWindows;
