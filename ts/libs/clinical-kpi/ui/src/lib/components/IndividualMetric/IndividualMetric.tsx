import {
  Card,
  Box,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';
import { INDIVIDUAL_METRIC_TEST_IDS } from './TestIds';
import { FC, useMemo } from 'react';
import { Metrics, METRICS_DISPLAY_NAME } from '../../constants';
import {
  formatMetricValue,
  formatMetricValueChange,
} from '../../utils/metricsUtils';

export type IndividualMetricProps = {
  type: Metrics;
  value: number;
  valueChange: number;
  goal?: number;
  rank?: number | string;
  testIdPrefix: string;
  possessiveOfMetric?: string;
  totalProviders?: string;
};

const makeStyles = () =>
  makeSxStyles({
    container: {
      display: 'flex',
      alignItems: 'left',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      borderRadius: '8px',
      padding: 2,
    },
    BoxWrapper: {
      display: 'flex',
      flexDirection: 'row',
      p: 1,
    },
    textWrapper: (theme) => ({
      p: 1,
      color: theme.palette.grey[700],
    }),
    rankTextWrapper: (theme) => ({
      color: theme.palette.text.secondary,
      p: 1,
    }),
    value: {
      fontSize: '1.5rem',
    },
    valueChange: {
      fontFamily: 'Open Sans',
      my: 'auto',
      mx: 1,
    },
  });

export const getPerformanceLineText = (
  type: keyof typeof Metrics,
  numericValueChange: number,
  displayValueChange: string,
  possessiveOfMetric?: string
) => {
  const performanceLineStart = `Since last week, ${possessiveOfMetric} ${METRICS_DISPLAY_NAME[type]}`;

  if (numericValueChange === 0) {
    return `${performanceLineStart} did not change`;
  } else if (numericValueChange > 0) {
    return `${performanceLineStart} went up ${displayValueChange.replace(
      '+',
      ''
    )}`;
  }

  return `${performanceLineStart} went down ${displayValueChange.replace(
    '-',
    ''
  )}`;
};

const IndividualMetric: FC<IndividualMetricProps> = ({
  type,
  value,
  valueChange,
  goal,
  rank,
  testIdPrefix,
  possessiveOfMetric,
  totalProviders,
}) => {
  const styles = makeStyles();

  const { displayValue } = useMemo(
    () => formatMetricValue({ type, value }),
    [type, value]
  );
  const {
    displayValue: displayValueChange,
    numericValue: numericValueChange,
    styles: valueChangeStyles,
  } = useMemo(
    () => formatMetricValueChange({ type, value: valueChange }),
    [type, valueChange]
  );

  const performanceLineText = getPerformanceLineText(
    type,
    numericValueChange,
    displayValueChange,
    possessiveOfMetric
  );

  return (
    <Card sx={styles.container}>
      <Box sx={styles.BoxWrapper}>
        <Typography
          data-testid={INDIVIDUAL_METRIC_TEST_IDS.TYPE(testIdPrefix)}
          variant="subtitle1"
        >
          {METRICS_DISPLAY_NAME[type]}
        </Typography>
      </Box>

      <Box sx={styles.BoxWrapper}>
        <Typography
          data-testid={INDIVIDUAL_METRIC_TEST_IDS.VALUE(testIdPrefix)}
          variant="h4"
          sx={styles.value}
        >
          {displayValue}
        </Typography>
        <Typography
          data-testid={INDIVIDUAL_METRIC_TEST_IDS.VALUE_CHANGE(testIdPrefix)}
          sx={[styles.valueChange, valueChangeStyles]}
          variant="label"
        >
          {displayValueChange}
        </Typography>
      </Box>
      {possessiveOfMetric && performanceLineText && (
        <Typography
          data-testid={INDIVIDUAL_METRIC_TEST_IDS.PERFORMANCE(testIdPrefix)}
          sx={styles.textWrapper}
          variant="label"
        >
          {performanceLineText}
        </Typography>
      )}
      {goal && (
        <Typography
          data-testid={INDIVIDUAL_METRIC_TEST_IDS.GOAL(testIdPrefix)}
          variant="body2"
          sx={styles.textWrapper}
        >
          Goal: {goal}
        </Typography>
      )}
      {rank && totalProviders && (
        <Typography
          data-testid={INDIVIDUAL_METRIC_TEST_IDS.GOAL(testIdPrefix)}
          variant="body2"
          sx={styles.rankTextWrapper}
        >
          Rank {rank} out of {totalProviders}
        </Typography>
      )}
    </Card>
  );
};

export default IndividualMetric;
