import { FC, useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  AccessTimeIcon,
  Alert,
  makeSxStyles,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@*company-data-covered*/design-system';
import { PatientPreferredEta } from '@*company-data-covered*/consumer-web-types';
import { SkipToken, skipToken } from '@reduxjs/toolkit/dist/query';
import { useSelector } from 'react-redux';
import { DaysEnum, ceilDate } from '../../utils';
import { SCHEDULE_TIME_WINDOWS_TEST_IDS } from './testIds';
import {
  selectZipCodeDetails,
  selectMarketDetails,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import {
  ZipCodeDetailsQuery,
  useGetZipCodeDetailsQuery,
  useGetMarketQuery,
  GetMarketQuery,
} from '@*company-data-covered*/station/data-access';
import { TimeRangeSelector } from '@*company-data-covered*/consumer-web/web-request/ui';

export interface ScheduleTimeWindowsProps {
  minTimeRangeValid: boolean;
  requestPreferredEta: PatientPreferredEta | undefined;
  requestPostalCode: string;
  onChangeRequestPreferredEta: (option: {
    patientPreferredEtaStart?: string;
    patientPreferredEtaEnd?: string;
  }) => void;
}

const makeStyles = () =>
  makeSxStyles({
    toggleButton: {
      fontSize: 15,
    },
    typographyError: (theme) => ({
      mt: 3,
      color: theme.palette.error.dark,
    }),
  });

export const getTimeSelectList = (
  day: DaysEnum
): {
  label: string;
  value: string;
}[] => {
  const selectedDate = day === DaysEnum.today ? dayjs() : dayjs().add(1, 'day');

  const marketUtc = {
    open: selectedDate.utc(true).startOf('day'),
    close: selectedDate.utc(true).endOf('day'),
  };

  const timestamps = [marketUtc.open];

  let timeCurrent = marketUtc.open;
  const addHours = () => {
    if (
      timeCurrent.isBefore(marketUtc.close) ||
      timeCurrent.isSame(marketUtc.close)
    ) {
      timeCurrent = timeCurrent.add(1, 'hour');
      timestamps.push(timeCurrent);
      addHours();
    } else {
      timestamps.splice(timestamps.length - 1, 2);
    }
  };

  addHours();

  return timestamps.map((timestamp) => ({
    value: timestamp.format(),
    label: timestamp.format('hh:mm a'),
  }));
};

export const getPreferredTimeUtc = (
  preferredTime?: Date | string
): Dayjs | null => {
  if (preferredTime) {
    return dayjs(preferredTime).utc();
  }

  return null;
};

export const getPreferredEta = (
  day: DaysEnum,
  startTime?: Date | string,
  endTime?: Date | string
): {
  patientPreferredEtaStart?: string;
  patientPreferredEtaEnd?: string;
} => {
  const preferredEta: {
    patientPreferredEtaStart?: string;
    patientPreferredEtaEnd?: string;
  } = {};

  if (startTime) {
    const preferredEtaStart =
      day === DaysEnum.tomorrow
        ? dayjs(startTime).add(1, 'day')
        : dayjs(startTime).subtract(1, 'day');

    preferredEta.patientPreferredEtaStart = preferredEtaStart.utc().format();
  }
  if (endTime) {
    const preferredEtaEnd =
      day === DaysEnum.tomorrow
        ? dayjs(endTime).add(1, 'day')
        : dayjs(endTime).subtract(1, 'day');

    preferredEta.patientPreferredEtaEnd = preferredEtaEnd.utc().format();
  }

  return preferredEta;
};

export const getSchedulingDay = (preferredTime?: Date | string): DaysEnum => {
  let schedulingDay = DaysEnum.today;

  if (preferredTime && dayjs(preferredTime).utc().isTomorrow()) {
    schedulingDay = DaysEnum.tomorrow;
  }

  return schedulingDay;
};

const ScheduleTimeWindows: FC<ScheduleTimeWindowsProps> = ({
  minTimeRangeValid,
  requestPreferredEta,
  requestPostalCode,
  onChangeRequestPreferredEta,
}) => {
  const styles = makeStyles();
  const [schedulingDay, setSchedulingDay] = useState(
    getSchedulingDay(
      requestPreferredEta?.patientPreferredEtaStart ||
        requestPreferredEta?.patientPreferredEtaEnd
    )
  );

  const zipcodeDetailsPayload: ZipCodeDetailsQuery | SkipToken =
    requestPostalCode ? { zipCode: requestPostalCode } : skipToken;

  useGetZipCodeDetailsQuery(zipcodeDetailsPayload);

  const { zipCodeDetails, isLoading: isZipCodeDetailsLoading } = useSelector(
    selectZipCodeDetails(zipcodeDetailsPayload)
  );

  const marketDetailsPayload: GetMarketQuery | SkipToken =
    zipCodeDetails?.marketId ?? skipToken;

  useGetMarketQuery(marketDetailsPayload);

  const { marketDetails: market, isLoading: isMarketDetailsLoading } =
    useSelector(selectMarketDetails(marketDetailsPayload));

  const isMarketLoading = isZipCodeDetailsLoading || isMarketDetailsLoading;

  const marketOpenCloseTime = useMemo(() => {
    if (!market?.schedules?.length) {
      return null;
    }
    const lastMarketSchedule = market.schedules[market.schedules.length - 1];

    const currentDate =
      schedulingDay === DaysEnum.tomorrow ? dayjs().add(1, 'day') : dayjs();
    const currentYear = currentDate.get('y');
    const currentMonth = currentDate.get('M');
    const currentDateDay = currentDate.get('date');

    const setCurrentDateUnits = (date: string) =>
      dayjs(date)
        .utc()
        .set('date', currentDateDay)
        .set('year', currentYear)
        .set('month', currentMonth);

    const openAtTime = setCurrentDateUnits(lastMarketSchedule.openAt);
    const closeAtTime = setCurrentDateUnits(lastMarketSchedule.closeAt);

    return { openAtTime, closeAtTime };
  }, [market, schedulingDay]);

  useEffect(() => {
    if (
      marketOpenCloseTime?.closeAtTime &&
      !requestPreferredEta?.patientPreferredEtaEnd
    ) {
      onChangeRequestPreferredEta({
        patientPreferredEtaEnd: marketOpenCloseTime.closeAtTime.format(),
      });
    }
    if (!requestPreferredEta?.patientPreferredEtaStart) {
      onChangeRequestPreferredEta({
        patientPreferredEtaStart: ceilDate(new Date(), 'minutes', 60)
          .utc(true)
          .format(),
      });
    }
  }, [
    marketOpenCloseTime,
    onChangeRequestPreferredEta,
    requestPreferredEta,
    schedulingDay,
  ]);

  const getMarketOpenAlertMessage = () => {
    if (!marketOpenCloseTime) {
      return null;
    }
    const formattedOpenAtTime = marketOpenCloseTime.openAtTime.format('h a');
    const formattedCloseAtTime = marketOpenCloseTime.closeAtTime.format('h a');

    return `Open today from ${formattedOpenAtTime} - ${formattedCloseAtTime}`;
  };

  const marketOpenAlertMessage = getMarketOpenAlertMessage();

  const preferredTimeUtc = {
    start: getPreferredTimeUtc(requestPreferredEta?.patientPreferredEtaStart),
    end: getPreferredTimeUtc(requestPreferredEta?.patientPreferredEtaEnd),
  };
  const timeSelectList = getTimeSelectList(schedulingDay);
  const showMinTimeRangeError =
    !minTimeRangeValid &&
    requestPreferredEta?.patientPreferredEtaStart &&
    requestPreferredEta?.patientPreferredEtaEnd;

  const changeSchedulingDay = (
    _event: React.MouseEvent<HTMLElement>,
    newDay: DaysEnum
  ) => {
    if (!newDay) {
      return;
    }

    setSchedulingDay(newDay);

    const preferredEta = getPreferredEta(
      newDay,
      requestPreferredEta?.patientPreferredEtaStart,
      requestPreferredEta?.patientPreferredEtaEnd
    );
    onChangeRequestPreferredEta(preferredEta);
  };

  const changeTimeOption = (name: string, value: string) => {
    onChangeRequestPreferredEta({
      [name]: value,
    });
  };

  return (
    <>
      {marketOpenAlertMessage && (
        <Alert
          icon={<AccessTimeIcon />}
          severity="success"
          message={marketOpenAlertMessage}
          data-testid={SCHEDULE_TIME_WINDOWS_TEST_IDS.ALERT}
          sx={{ mt: 3 }}
        />
      )}
      <Typography
        variant="body1"
        sx={{ mt: 3 }}
        data-testid={SCHEDULE_TIME_WINDOWS_TEST_IDS.AVAILABILITY_MESSAGE}
      >
        The more availability you have, the more likely we can see you today. We
        require a minimum 4 hour service window for all requests.
      </Typography>
      <Typography variant="h6" sx={{ mt: 3 }}>
        I’m available
      </Typography>
      <ToggleButtonGroup
        color="primary"
        value={schedulingDay}
        exclusive
        onChange={changeSchedulingDay}
        size="small"
        fullWidth
        sx={{ mt: 1 }}
        data-testid={SCHEDULE_TIME_WINDOWS_TEST_IDS.DAY_TOGGLE_BUTTON_GROUP}
      >
        <ToggleButton
          value={DaysEnum.today}
          data-testid={SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(
            DaysEnum.today
          )}
          sx={styles.toggleButton}
        >
          Today
        </ToggleButton>
        <ToggleButton
          value={DaysEnum.tomorrow}
          data-testid={SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(
            DaysEnum.tomorrow
          )}
          sx={styles.toggleButton}
        >
          Tomorrow
        </ToggleButton>
      </ToggleButtonGroup>
      <TimeRangeSelector
        title="From"
        name="patientPreferredEtaStart"
        value={preferredTimeUtc.start?.format() || ''}
        dataTestIdPrefix="start-time"
        onChangeTime={changeTimeOption}
        timeSelectList={timeSelectList}
        isLoading={isMarketLoading}
      />
      <TimeRangeSelector
        title="To"
        name="patientPreferredEtaEnd"
        value={preferredTimeUtc.end?.format() || ''}
        dataTestIdPrefix="end-time"
        onChangeTime={changeTimeOption}
        timeSelectList={timeSelectList}
        isLoading={isMarketLoading}
      />
      {showMinTimeRangeError && (
        <Typography
          variant="body2"
          sx={styles.typographyError}
          data-testid={
            SCHEDULE_TIME_WINDOWS_TEST_IDS.MIN_TIME_RANGE_ERROR_MESSAGE
          }
        >
          Please select a minimum 4 hour time window.
        </Typography>
      )}
    </>
  );
};

export default ScheduleTimeWindows;
