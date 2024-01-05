import { FC, ReactNode } from 'react';
import statsig from 'statsig-js';

export interface StatsigGateGuardProps {
  children: ReactNode;
  errorComponent: ReactNode;
  gateName: string;
}

export const StatsigGateGuard: FC<StatsigGateGuardProps> = ({
  children,
  gateName,
  errorComponent,
}) => {
  const enabled = statsig.checkGate(gateName);

  if (!enabled) {
    return <>{errorComponent}</>;
  }

  return <>{children}</>;
};
