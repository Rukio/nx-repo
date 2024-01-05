import {
  selectIsRequesterRelationshipSelf,
  selectOffboardReason,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  OffboardSection,
  PageLayout,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSegment } from '@*company-data-covered*/segment/feature';
import { getOffboardData } from './utils';
import { SEGMENT_EVENTS } from '../constants';

export const Offboard: FC = () => {
  const segment = useSegment();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_OFFBOARD);
  }, [segment]);

  const isRequesterRelationshipSelf = useSelector(
    selectIsRequesterRelationshipSelf
  );
  const offboardReason = useSelector(selectOffboardReason);

  const { title: offboardTitle, message: offbaordMessage } = getOffboardData(
    isRequesterRelationshipSelf,
    offboardReason
  );

  return (
    <PageLayout>
      <OffboardSection title={offboardTitle} message={offbaordMessage} />
    </PageLayout>
  );
};
