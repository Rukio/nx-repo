import { FC, useMemo } from 'react';
import {
  AuthenticatedUser,
  MarketMetrics,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import PeerRankingsData from '../PeerRankingsData';
import { buildProvidersRanking } from '../../util';
import {
  MetricsKeys,
  MetricsChangeKeys,
  ProviderPosition,
} from '../../../constants';
import { SortOrder } from '../../types';

interface Props {
  metrics?: MarketMetrics;
  authenticatedUserId: AuthenticatedUser['id'];
  isLoading: boolean;
}

const SurveyCaptureRate: FC<Props> = ({
  metrics,
  authenticatedUserId,
  isLoading,
}) => {
  const onSceneRankingProvidersData = useMemo(
    () =>
      buildProvidersRanking({
        metrics,
        key: MetricsKeys.SurveyCapture,
        changeKey: MetricsChangeKeys.SurveyCapture,
        sortOrder: SortOrder.DESC,
        authenticatedUserId,
        includedProviderPositions: [ProviderPosition.DHMT],
        type: Metrics.SurveyCapture,
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
      type={Metrics.SurveyCapture}
    />
  );
};

export default SurveyCaptureRate;
