import {
  RiskStratScoreThreshold,
  getScoreThreshold,
} from '@*company-data-covered*/caremanager/data-access-types';
import { Chip, AlertColor } from '@*company-data-covered*/design-system';

export const RISK_STRAT_SCORE_CHIP_TEST_ID = 'risk-strat-score-chip';

const scorePropsMap: Record<
  RiskStratScoreThreshold,
  { label: string; color: AlertColor }
> = {
  [RiskStratScoreThreshold.Low]: {
    label: 'Low',
    color: 'success',
  },
  [RiskStratScoreThreshold.Medium]: {
    label: 'Medium',
    color: 'warning',
  },
  [RiskStratScoreThreshold.High]: {
    label: 'High',
    color: 'error',
  },
};

export const RiskStratScoreChip: React.FC<{ score: number }> = ({ score }) => {
  const { label, color } = scorePropsMap[getScoreThreshold(score)];

  return (
    <Chip
      color={color}
      label={label}
      size="small"
      data-testid={RISK_STRAT_SCORE_CHIP_TEST_ID}
    />
  );
};
