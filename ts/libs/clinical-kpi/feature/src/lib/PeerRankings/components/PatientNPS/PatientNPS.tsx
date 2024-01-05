import { FC, useMemo } from 'react';
import {
  AuthenticatedUser,
  MarketMetrics,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import PeerRankingsData from '../PeerRankingsData';
import { buildProvidersRanking } from '../../util';
import { MetricsKeys, MetricsChangeKeys } from '../../../constants';
import { SortOrder } from '../../types';

interface Props {
  metrics?: MarketMetrics;
  authenticatedUserId: AuthenticatedUser['id'];
  isLoading: boolean;
}

const PatientNPS: FC<Props> = ({ metrics, authenticatedUserId, isLoading }) => {
  const onSceneRankingProvidersData = useMemo(
    () =>
      buildProvidersRanking({
        metrics,
        key: MetricsKeys.NPS,
        changeKey: MetricsChangeKeys.NPS,
        sortOrder: SortOrder.DESC,
        authenticatedUserId,
        type: Metrics.NPS,
      }),
    [metrics, authenticatedUserId]
  );

  return (
    <PeerRankingsData
      marqueeLeaderProvidersData={
        onSceneRankingProvidersData?.marqueeLeaderProviders
      }
      currentProviderData={onSceneRankingProvidersData?.currentProviderData}
      rankingProvidersData={onSceneRankingProvidersData?.rankTableProviders}
      isLoading={isLoading}
      type={Metrics.NPS}
    />
  );
};

export default PatientNPS;
