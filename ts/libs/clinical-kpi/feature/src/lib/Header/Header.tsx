import { FC } from 'react';
import { GreetingHeader } from '@*company-data-covered*/clinical-kpi/ui';
import {
  ProfilePosition,
  selectAuthenticatedUserFirstname,
  selectAuthenticatedUserId,
  selectAuthenticatedUserMarkets,
  selectSelectedMarketId,
  selectSelectedPositionName,
  setMarketId,
  setSelectedPosition,
  setCurrentPage,
  useAppDispatch,
  useAppSelector,
  useGetLatestMetricsForProviderQuery,
  DEFAULT_PAGE_NUMBER,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { useSelector } from 'react-redux';

type HeaderProps = {
  stationURL?: string;
  isLeadersView?: boolean;
};

const Header: FC<HeaderProps> = ({
  stationURL = '',
  isLeadersView = false,
}) => {
  const dispatch = useAppDispatch();
  const selectedPositionName = useSelector(selectSelectedPositionName);
  const { selectedMarketId } = useSelector(selectSelectedMarketId);
  const { userId } = useAppSelector(selectAuthenticatedUserId);
  const { firstName = '' } = useAppSelector(selectAuthenticatedUserFirstname);
  const { markets = [] } = useAppSelector(selectAuthenticatedUserMarkets);

  const { data: metrics, isLoading } = useGetLatestMetricsForProviderQuery(
    userId ?? skipToken
  );

  const handleMarketChange = (marketId: string) => {
    dispatch(setMarketId({ selectedMarketId: marketId }));
    dispatch(setCurrentPage({ page: DEFAULT_PAGE_NUMBER }));
  };

  const handlePositionChange = (positionName: ProfilePosition) => {
    dispatch(setSelectedPosition({ selectedPositionName: positionName }));
  };

  const { updatedAt, createdAt } = metrics ?? {};
  const lastUpdated = updatedAt || createdAt || new Date().toISOString();

  return (
    <GreetingHeader
      firstName={firstName}
      selectedMarketId={selectedMarketId}
      selectedPositionName={selectedPositionName}
      visitsCompleted={metrics?.careRequestsCompletedLastSevenDays || 0}
      learnMoreLink="https://*company-data-covered*-internal.helpjuice.com/en_US/performance-hub-helpjuice"
      lastUpdated={lastUpdated}
      markets={markets}
      isLoading={isLoading}
      stationURL={stationURL}
      isLeadersView={isLeadersView}
      handleMarketChange={handleMarketChange}
      handlePositionChange={handlePositionChange}
    />
  );
};

export default Header;
