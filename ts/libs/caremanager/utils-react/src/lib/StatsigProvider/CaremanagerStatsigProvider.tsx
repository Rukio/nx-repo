import { ReactNode } from 'react';
import {
  StatsigEnvironment,
  StatsigProvider,
  StatsigUser,
} from 'statsig-react';
import { useAuth0 } from '@auth0/auth0-react';

type StatsigComponentProps = {
  children: ReactNode;
  tier: StatsigEnvironment['tier'];
  apiKey: string;
  userID: StatsigUser['userID'];
};

export const CaremanagerStatsigProvider = ({
  children,
  tier,
  apiKey,
  userID,
}: StatsigComponentProps) => {
  const { user } = useAuth0();

  const env = {
    tier: tier,
  };

  return (
    <StatsigProvider
      data-testid="statsig-provider"
      sdkKey={apiKey}
      user={{ userID, email: user?.email }}
      options={{ environment: env }}
      waitForInitialization
    >
      {children}
    </StatsigProvider>
  );
};
