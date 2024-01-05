import { FC } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  StatsigProvider,
  StatsigProviderProps,
} from '@*company-data-covered*/statsig/feature';
import { Typography } from '@*company-data-covered*/design-system';
import { LoadingContainer } from '@*company-data-covered*/modality/ui';
import { MODALITY_STATSIG_PROVIDER_TEST_IDS } from './testIds';

export type ModalityStatsigProviderProps = StatsigProviderProps;

const ModalityStatsigProvider: FC<ModalityStatsigProviderProps> = ({
  children,
  clientKey,
  options,
}) => {
  const { user, isLoading, error } = useAuth0();

  if (isLoading) {
    return (
      <LoadingContainer
        testIdPrefix={
          MODALITY_STATSIG_PROVIDER_TEST_IDS.LOADING_CONTAINER_PREFIX
        }
        spinnerSize={100}
      />
    );
  }

  if (error || !user) {
    return <Typography variant="h1">{error?.message}</Typography>;
  }

  return (
    <StatsigProvider
      clientKey={clientKey}
      user={{ email: user.email }}
      options={options}
      loadingComponent={
        <LoadingContainer
          testIdPrefix={
            MODALITY_STATSIG_PROVIDER_TEST_IDS.LOADING_CONTAINER_PREFIX
          }
          spinnerSize={100}
        />
      }
    >
      {children}
    </StatsigProvider>
  );
};

export default ModalityStatsigProvider;
