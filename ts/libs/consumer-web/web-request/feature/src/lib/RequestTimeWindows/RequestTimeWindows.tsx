import { FC, useCallback } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  StatsigEvents,
  StatsigActions,
  StatsigPageCategory,
  PatientPreferredEta,
} from '@*company-data-covered*/consumer-web-types';
import { PageLayout, Message911Variant } from '../components/PageLayout';
import {
  selectAddress,
  selectPatientPreferredEta,
  setPatientPreferredEta,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { ScheduleTimeWindows, PreferredTimeWindows } from '../components';
import { useUserFlow } from '../hooks';
import { isFutureDate, StatsigLogEvent } from '../utils';
import { REQUEST_TIME_WINDOWS_TEST_IDS } from './testIds';

const LOG_EVENT: StatsigLogEvent = {
  eventName: StatsigEvents.REQUEST_PREFERRED_TIME_WINDOW,
  value: StatsigActions.ADDED_PREFERRED_TIME_WINDOW,
  metadata: {
    page: StatsigPageCategory.REQUEST_PREFERRED_TIME_WINDOW,
    origin: window.location.host,
  },
};

const checkMinTimeRange = (
  startTime?: Date | string,
  endTime?: Date | string
) => {
  if (!startTime || !endTime) {
    return false;
  }

  const startTimeUtc = dayjs(startTime).utc();
  const endTimeUtc = dayjs(endTime).utc();

  return (
    Math.abs(startTimeUtc.diff(endTimeUtc, 'hours')) >= 4 &&
    startTimeUtc.isBefore(endTimeUtc)
  );
};

const RequestTimeWindows: FC = () => {
  const dispatch = useAppDispatch();

  const { postalCode: requestPostalCode } = useSelector(selectAddress);
  const requestPreferredEta = useSelector(selectPatientPreferredEta);

  const isFutureEta = isFutureDate(requestPreferredEta?.patientPreferredEtaEnd);
  const userFlow = useUserFlow();

  const onChangeRequestPreferredEta = useCallback(
    (data: Partial<PatientPreferredEta>) => {
      dispatch(setPatientPreferredEta(data));
    },
    [dispatch]
  );

  const titleText = userFlow.renderScheduleTimeWindow
    ? 'When are you available for a visit?'
    : 'When would you like a visit?';
  const titleDataTestId = userFlow.renderScheduleTimeWindow
    ? REQUEST_TIME_WINDOWS_TEST_IDS.SCHEDULE_TIME_HEADER
    : REQUEST_TIME_WINDOWS_TEST_IDS.PREFERRED_TIME_HEADER;
  const minTimeRangeValid = checkMinTimeRange(
    requestPreferredEta?.patientPreferredEtaStart,
    requestPreferredEta?.patientPreferredEtaEnd
  );
  const disableContinueButton =
    (!requestPreferredEta?.patientPreferredEtaStart &&
      !requestPreferredEta?.patientPreferredEtaEnd) ||
    !isFutureEta ||
    !minTimeRangeValid;

  return (
    <PageLayout
      titleOptions={{
        text: titleText,
        dataTestId: titleDataTestId,
      }}
      continueOptions={{
        showBtn: true,
        logEventData: LOG_EVENT,
        dataTestId: REQUEST_TIME_WINDOWS_TEST_IDS.CONTINUE_BUTTON,
        disabled: disableContinueButton,
      }}
      message911Variant={Message911Variant.Bottom}
    >
      {userFlow.renderScheduleTimeWindow ? (
        <ScheduleTimeWindows
          minTimeRangeValid={minTimeRangeValid}
          requestPreferredEta={requestPreferredEta}
          requestPostalCode={requestPostalCode}
          onChangeRequestPreferredEta={onChangeRequestPreferredEta}
        />
      ) : (
        <PreferredTimeWindows
          isFutureEta={isFutureEta}
          requestPreferredEta={requestPreferredEta}
          onChangeRequestPreferredEta={onChangeRequestPreferredEta}
        />
      )}
    </PageLayout>
  );
};

export default RequestTimeWindows;
