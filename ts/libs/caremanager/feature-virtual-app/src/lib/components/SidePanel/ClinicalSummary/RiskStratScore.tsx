import { FC } from 'react';
import { Chip } from '@*company-data-covered*/design-system';

export enum RiskStratStates {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

interface RiskStratProps {
  score: RiskStratStates;
}

const RISK_STRAT_CHIP_MAP: Record<
  RiskStratStates,
  'success' | 'warning' | 'error'
> = {
  [RiskStratStates.Low]: 'success',
  [RiskStratStates.Medium]: 'warning',
  [RiskStratStates.High]: 'error',
};

export const RiskStratScore: FC<RiskStratProps> = ({ score }) => {
  return <Chip label="Low" color={RISK_STRAT_CHIP_MAP[score]} />;
};
