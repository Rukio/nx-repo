import { FC, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetMarketQuery,
  domainSelectMarket,
  useGetCareRequestQuery,
  useCheckMarketFeasibilityQuery,
  selectSelfScheduleData,
  selectCareRequest,
  CheckMarketFeasibilityPayload,
  selectMarketFeasibilityStatus,
  selectMarketFeasibilityLoadingData,
  updateEtaRangesAndCareRequestStatus,
  selectManageSelfScheduleLoadingState,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  PageLayout,
  BookedTimeWindowForm,
  BookedTimeWindowFormFieldValues,
  AvailabilityDayToggleValue,
  LoadingSection,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { SubmitHandler, useForm } from 'react-hook-form';
import { getMarketTimeSelectList, UTC_TIME_ZONE } from '../utils/date';
import { isMarketFeasibilityAvailable } from '../utils/market';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import {
  startOfToday,
  format,
  isToday,
  isTomorrow,
  addDays,
  set,
  startOfTomorrow,
} from 'date-fns';
import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import { ONLINE_SELF_SCHEDULING_ROUTES, SEGMENT_EVENTS } from '../constants';
import { useSegment } from '@*company-data-covered*/segment/feature';

export const BookedTime: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const segment = useSegment();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_BOOKED_TIME);
  }, [segment]);

  const cacheData = useSelector(selectSelfScheduleData);
  useGetCareRequestQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  useGetMarketQuery(cacheData?.marketId || skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const { data: market, isLoading: isMarketLoading } = useSelector(
    domainSelectMarket(cacheData?.marketId || skipToken)
  );
  const { data: careRequest, isLoading: isCareRequestLoading } =
    useSelector(selectCareRequest);

  const checkMarketTodayAvailabilityPayload:
    | CheckMarketFeasibilityPayload
    | SkipToken =
    market?.id && careRequest?.id
      ? {
          marketId: market.id,
          careRequestId: careRequest.id,
          date: format(startOfToday(), 'MM-dd-yyyy'),
        }
      : skipToken;

  const checkMarketTomorrowAvailabilityPayload:
    | CheckMarketFeasibilityPayload
    | SkipToken = market?.id
    ? {
        marketId: market.id,
        careRequestId: careRequest?.id,
        date: format(startOfTomorrow(), 'MM-dd-yyyy'),
      }
    : skipToken;

  useCheckMarketFeasibilityQuery(checkMarketTodayAvailabilityPayload, {
    refetchOnMountOrArgChange: true,
  });

  const { availabilityStatus: todayMarketAvailabilityStatus } = useSelector(
    selectMarketFeasibilityStatus(checkMarketTodayAvailabilityPayload)
  );
  const { isLoading: isTodayMarketAvailabilityLoading } = useSelector(
    selectMarketFeasibilityLoadingData(checkMarketTodayAvailabilityPayload)
  );
  const isMarketAvailableToday = isMarketFeasibilityAvailable(
    todayMarketAvailabilityStatus
  );

  const { availabilityStatus: tomorrowMarketAvailabilityStatus } = useSelector(
    selectMarketFeasibilityStatus(checkMarketTomorrowAvailabilityPayload)
  );
  const { isLoading: isTomorrowMarketAvailabilityLoading } = useSelector(
    selectMarketFeasibilityLoadingData(checkMarketTomorrowAvailabilityPayload)
  );
  const isMarketAvailableTomorrow = isMarketFeasibilityAvailable(
    tomorrowMarketAvailabilityStatus
  );

  const { isLoading: isManageSelfScheduleLoading } = useSelector(
    selectManageSelfScheduleLoadingState
  );

  const isLoadingPageData =
    isMarketLoading ||
    isCareRequestLoading ||
    isTodayMarketAvailabilityLoading ||
    isTomorrowMarketAvailabilityLoading;

  const {
    timeSelectOptions,
    marketStartTimeFormatted,
    marketEndTimeFormatted,
  } = useMemo(() => {
    const marketSchedule = market?.schedules?.[0];
    if (!marketSchedule) {
      return {
        timeSelectOptions: [],
      };
    }

    return {
      marketStartTimeFormatted: format(
        utcToZonedTime(marketSchedule.openAt, UTC_TIME_ZONE),
        'h a'
      ).toLowerCase(),
      marketEndTimeFormatted: format(
        utcToZonedTime(marketSchedule.closeAt, UTC_TIME_ZONE),
        'h a'
      ).toLowerCase(),
      timeSelectOptions: getMarketTimeSelectList(
        marketSchedule.openAt,
        marketSchedule.closeAt,
        market.tzName
      ),
    };
  }, [market]);

  const getDefaultTimeRanges = () => {
    const preferredStartTime = new Date(
      cacheData?.preferredEta?.patientPreferredEtaStart || ''
    );
    const isPreferredTimeToday = isToday(preferredStartTime);
    const isPreferredTimeTomorrow = isTomorrow(preferredStartTime);

    const marketAvailabilityDay =
      (isPreferredTimeToday && isMarketAvailableToday) ||
      (isPreferredTimeTomorrow && !isMarketAvailableTomorrow)
        ? AvailabilityDayToggleValue.Today
        : AvailabilityDayToggleValue.Tomorrow;

    return {
      startTime: timeSelectOptions[0]?.value || '',
      endTime: timeSelectOptions.at(-1)?.value || '',
      selectedAvailabilityDay: marketAvailabilityDay,
    };
  };

  const { control, watch, handleSubmit } =
    useForm<BookedTimeWindowFormFieldValues>({
      values: getDefaultTimeRanges(),
    });

  const [
    startTimeFormValue,
    endTimeFormValue,
    selectedAvailabilityDayFormValue,
  ] = watch(['startTime', 'endTime', 'selectedAvailabilityDay']);

  const userTimeWindowSelectedTime = useMemo(() => {
    const isTodaySelected =
      selectedAvailabilityDayFormValue === AvailabilityDayToggleValue.Today;
    const currentDate = new Date();
    const daysToAdd = isTodaySelected ? 0 : 1;
    const marketTZ = market?.tzName || '';

    const startDateAndTime = addDays(
      zonedTimeToUtc(
        set(currentDate, {
          hours: Number(startTimeFormValue),
          minutes: 0,
          seconds: 0,
        }),
        marketTZ
      ),
      daysToAdd
    );
    const endDateAndTime = addDays(
      zonedTimeToUtc(
        set(currentDate, {
          hours: Number(endTimeFormValue),
          minutes: 0,
          seconds: 0,
        }),
        marketTZ
      ),
      daysToAdd
    );

    const startTimeSec = startDateAndTime.getTime() / 1000;
    const endTimeSec = endDateAndTime.getTime() / 1000;

    return {
      startTimeSec,
      endTimeSec,
      date: format(startDateAndTime, 'MM-dd-yyyy'),
    };
  }, [
    startTimeFormValue,
    endTimeFormValue,
    selectedAvailabilityDayFormValue,
    market?.tzName,
  ]);

  const userTimeCheckMarketAvailabilityPayload:
    | CheckMarketFeasibilityPayload
    | SkipToken = market?.id
    ? {
        marketId: market.id,
        careRequestId: careRequest?.id,
        ...userTimeWindowSelectedTime,
      }
    : skipToken;

  useCheckMarketFeasibilityQuery(userTimeCheckMarketAvailabilityPayload);

  const { availabilityStatus: userTimeMarketAvailabilityStatus } = useSelector(
    selectMarketFeasibilityStatus(userTimeCheckMarketAvailabilityPayload)
  );

  const isMarketAvailableForUserTime = isMarketFeasibilityAvailable(
    userTimeMarketAvailabilityStatus
  );

  const getMarketAvailabilityErrorMessage = () => {
    const preferredStartTime = new Date(
      cacheData?.preferredEta?.patientPreferredEtaStart || ''
    );
    const isPreferredTimeToday = isTomorrow(preferredStartTime);

    if (isPreferredTimeToday && !isMarketAvailableTomorrow) {
      return 'Sorry, appointments have booked up fast and we’re not able to see you today. Please select your availability tomorrow.';
    }

    return 'Sorry, appointments have booked up fast and we’re not able to see you tomorrow. Please select a time today.';
  };

  const marketOpenTimeMessage = `Open ${selectedAvailabilityDayFormValue.toLowerCase()} from ${marketStartTimeFormatted} - ${marketEndTimeFormatted}`;

  const isSelectedDayFullyBooked =
    (selectedAvailabilityDayFormValue === AvailabilityDayToggleValue.Today &&
      !isMarketAvailableToday) ||
    (selectedAvailabilityDayFormValue === AvailabilityDayToggleValue.Tomorrow &&
      !isMarketAvailableTomorrow);

  const showTimeRangeError =
    !!startTimeFormValue &&
    !!endTimeFormValue &&
    Number(endTimeFormValue) - Number(startTimeFormValue) < 4;

  const onSubmit: SubmitHandler<BookedTimeWindowFormFieldValues> = () => {
    dispatch(
      updateEtaRangesAndCareRequestStatus({
        startsAt: new Date(
          userTimeWindowSelectedTime.startTimeSec * 1000
        ).toISOString(),
        endsAt: new Date(
          userTimeWindowSelectedTime.endTimeSec * 1000
        ).toISOString(),
        careRequestId: Number(careRequest?.id),
        careRequestStatusId: Number(careRequest?.activeStatus?.id),
      })
    )
      .unwrap()
      .then(({ isError }) => {
        if (!isError) {
          navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONFIRMATION);
        }
      });
  };

  return (
    <PageLayout isLoading={isLoadingPageData}>
      {isManageSelfScheduleLoading ? (
        <LoadingSection
          title="Finding your care team"
          subtitle="Based on your details, we’re finding the best team to come to you."
        />
      ) : (
        <BookedTimeWindowForm
          startTimeOptions={timeSelectOptions}
          endTimeOptions={timeSelectOptions}
          timeWindowSectionTitle={
            isSelectedDayFullyBooked ? '' : "I'm available"
          }
          openTimeAlertMessage={marketOpenTimeMessage}
          onSubmit={handleSubmit(onSubmit)}
          formControl={control}
          isSubmitButtonDisabled={!isMarketAvailableForUserTime}
          isSelectedTimeAvailabilityAlert={!isMarketAvailableForUserTime}
          marketAvailabilityAlertText={getMarketAvailabilityErrorMessage()}
          disableRanges={isSelectedDayFullyBooked}
          isTimeRangeErrorShown={showTimeRangeError}
        />
      )}
    </PageLayout>
  );
};
