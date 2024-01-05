import React from 'react';
import { useSelector } from 'react-redux';
import { StatsigOptions } from 'statsig-js';
import { selectAuthenticatedUser } from '@*company-data-covered*/clinical-kpi/data-access';
import { LoadingContainer } from '@*company-data-covered*/clinical-kpi/ui';
import { StatsigProvider } from '@*company-data-covered*/statsig/feature';
import { CLINICAL_KPI_STATSIG_PROVIDER_TEST_IDS } from './TestIds';
import { Typography } from '@*company-data-covered*/design-system';

interface ClinicalKPIStatsigProviderProps {
  children: React.ReactNode;
  clientKey: string;
  options: StatsigOptions;
}

const ERROR_TEXT = 'Unable to get current user';

const ClinicalKPIStatsigProvider: React.FC<ClinicalKPIStatsigProviderProps> = ({
  children,
  clientKey,
  options,
}) => {
  const {
    data: user,
    isLoading,
    isError,
  } = useSelector(selectAuthenticatedUser);

  if (isLoading) {
    return <LoadingContainer testIdPrefix="statsig-provider" />;
  }

  if (isError || !user) {
    return <Typography variant="h1">{ERROR_TEXT}</Typography>;
  }

  return (
    <StatsigProvider
      clientKey={clientKey}
      user={{
        userID: user.id,
        email: user.email,
        custom: {
          markets: user.markets?.map((market) => market.shortName).join('|'),
        },
      }}
      options={options}
      loadingComponent={
        <LoadingContainer
          testIdPrefix={
            CLINICAL_KPI_STATSIG_PROVIDER_TEST_IDS.LOADING_COMPONENT_PREFIX
          }
        />
      }
    >
      {children}
    </StatsigProvider>
  );
};

export default ClinicalKPIStatsigProvider;
