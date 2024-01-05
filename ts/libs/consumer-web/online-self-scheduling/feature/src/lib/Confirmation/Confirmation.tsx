import { FC, ReactNode, useEffect } from 'react';
import {
  useGetCareRequestQuery,
  selectCareRequest,
  domainSelectMarket,
  useGetMarketQuery,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  PageLayout,
  SelfSchedulingConfirmation,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { RequestProgressStep, SEGMENT_EVENTS } from '../constants';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { formatDate, getAvailabilityDay } from '../utils/date';
import { useSegment } from '@*company-data-covered*/segment/feature';
import { formatPhoneNumber } from '../utils/phoneNumber';

export type ConfirmationProps = {
  dispatcherPhoneNumber: string;
};

export const Confirmation: FC<ConfirmationProps> = ({
  dispatcherPhoneNumber,
}) => {
  const segment = useSegment();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_SCHEDULE);
  }, [segment]);

  useGetCareRequestQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data: careRequest, isLoading: isCareRequestLoading } =
    useSelector(selectCareRequest);

  const chosenMarketId = careRequest?.marketId || skipToken;

  useGetMarketQuery(chosenMarketId, {
    refetchOnMountOrArgChange: true,
  });

  const { data: domainMarket, isLoading: isMarketLoading } = useSelector(
    domainSelectMarket(chosenMarketId)
  );

  const isLoading = isMarketLoading || isCareRequestLoading;

  const etaRange = careRequest?.etaRanges?.[0];

  const availabilityDay = getAvailabilityDay(
    etaRange?.startsAt,
    domainMarket?.timezone
  );

  const appointmentStartHour = formatDate(
    etaRange?.startsAt,
    domainMarket?.timezone,
    'h:mm a'
  );

  const appointmentEndHour = formatDate(
    etaRange?.endsAt,
    domainMarket?.timezone,
    'h:mm a'
  );

  const renderSubtitle = (): ReactNode => {
    return (
      <>
        Your medical team will be out to see you {availabilityDay} between{' '}
        <b>
          {appointmentStartHour} and {appointmentEndHour}.
        </b>
        <br />
        <br />
        You'll receive a text message with a link to check-in for your
        appointment and track your care team's status.
      </>
    );
  };

  return (
    <PageLayout
      stepProgress={RequestProgressStep.Address}
      isLoading={isLoading}
    >
      <SelfSchedulingConfirmation
        *company-data-covered*PhoneNumber={formatPhoneNumber(dispatcherPhoneNumber)}
        subtitle={renderSubtitle()}
      />
    </PageLayout>
  );
};
