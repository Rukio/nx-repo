import { FC, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  ScreeningRequired,
  PageLayout,
  LoadingSection,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  selectNotificationJobId,
  useCancelNotificationJobMutation,
  selectSelfScheduleData,
  selectIsRequesterRelationshipSelf,
  useGetMarketQuery,
  domainSelectMarket,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  getStructuredSymptomBySelectedSymptoms,
  StructuredSymptomCallTo,
} from '../utils/statsig';
import { SEGMENT_EVENTS } from '../constants';
import { SkipToken, skipToken } from '@reduxjs/toolkit/query';
import statsig from 'statsig-js';
import { formatPhoneNumber } from '../utils/phoneNumber';

export type CallScreenerProps = {
  dispatcherPhoneNumber: string;
};

export const CallScreener: FC<CallScreenerProps> = ({
  dispatcherPhoneNumber,
}) => {
  const isStationCallCenterLineEnabled = statsig.checkGate(
    'station_call_center_line'
  );
  const segment = useSegment();
  const notificationJobId = useSelector(selectNotificationJobId);
  const scheduleData = useSelector(selectSelfScheduleData);
  const isRelationshipSelf = useSelector(selectIsRequesterRelationshipSelf);
  const [cancelNotification] = useCancelNotificationJobMutation();
  const structuredSymptom = getStructuredSymptomBySelectedSymptoms(
    scheduleData?.symptoms
  );

  const marketId: string | number | SkipToken =
    scheduleData?.marketId || skipToken;

  useGetMarketQuery(marketId);

  const { isLoading: isMarketLoading, data: market } = useSelector(
    domainSelectMarket(marketId)
  );

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_SCREENING);
  }, [segment]);

  const phoneNumberToCall = useMemo(() => {
    const { route_call_to: callTo } = structuredSymptom || {};
    if (
      callTo === StructuredSymptomCallTo.Screener &&
      market?.stateLocale?.screenerLine?.phoneNumber
    ) {
      return market.stateLocale.screenerLine.phoneNumber;
    }

    if (
      isStationCallCenterLineEnabled &&
      market?.stateLocale?.dispatcherLine?.phoneNumber
    ) {
      return market.stateLocale.dispatcherLine.phoneNumber;
    }

    return dispatcherPhoneNumber;
  }, [
    structuredSymptom,
    market?.stateLocale?.screenerLine?.phoneNumber,
    dispatcherPhoneNumber,
    market?.stateLocale?.dispatcherLine?.phoneNumber,
    isStationCallCenterLineEnabled,
  ]);

  const onClickCall = () => {
    if (notificationJobId) {
      cancelNotification(notificationJobId);
    }
    segment.track(SEGMENT_EVENTS.SCREENING_CLICK_CALL);
  };

  if (isMarketLoading) {
    const loadingSectionTitle = isRelationshipSelf
      ? 'Finding your care team'
      : 'Finding a care team';

    const loadingSectionSubtitle = isRelationshipSelf
      ? 'Based on your details, we’re finding the best team to come to you.'
      : 'Based on the patient’s details, we’re finding the best medical team to come to them.';

    return (
      <LoadingSection
        title={loadingSectionTitle}
        subtitle={loadingSectionSubtitle}
      />
    );
  }

  return (
    <PageLayout>
      <ScreeningRequired
        phoneNumber={formatPhoneNumber(phoneNumberToCall)}
        onClickCall={onClickCall}
        isRelationshipSelf={isRelationshipSelf}
      />
    </PageLayout>
  );
};
