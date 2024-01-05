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

const OnSceneTime: FC<Props> = ({
  metrics,
  authenticatedUserId,
  isLoading,
}) => {
  const onSceneRankingProvidersData = useMemo(
    () =>
      buildProvidersRanking({
        metrics,
        key: MetricsKeys.OnSceneTime,
        changeKey: MetricsChangeKeys.OnSceneTime,
        sortOrder: SortOrder.ASC,
        authenticatedUserId,
        type: Metrics.OnSceneTime,
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
      type={Metrics.OnSceneTime}
    />
  );
};

export default OnSceneTime;
