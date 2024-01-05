import { FC } from 'react';
import {
  DefaultAlert,
  Metrics,
  MetricsSection,
} from '@*company-data-covered*/clinical-kpi/ui';
import {
  Box,
  PersonIcon,
  makeSxStyles,
  Skeleton,
  Grid,
  InfoOutlinedIcon,
  Typography,
} from '@*company-data-covered*/design-system';

import { PERFORMANCE_TEST_IDS } from './TestIds';
import { MetricsKeys, MetricsChangeKeys } from '../constants';

export interface IndividualMetricConfiguration {
  type: Metrics;
  key: MetricsKeys;
  changeKey: MetricsChangeKeys;
}

const makeStyles = () =>
  makeSxStyles({
    defaultErrorAlert: {
      marginY: 1.5,
    },
    metricsContainer: {
      width: '100%',
      pt: 3,
      pb: 1,
    },
    placeholder: (theme) => ({
      marginY: theme.spacing(4),
      height: 188,
    }),
    defaultAlertContainer: {
      display: 'flex',
      marginY: 4,
    },
    defaultText: {
      marginLeft: 2,
    },
    infoIcon: {
      color: 'green',
    },
  });

export type PerformanceContainerProps = {
  title: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  children?: React.ReactNode;
};

const PerformanceContainer: FC<PerformanceContainerProps> = ({
  title,
  isLoading,
  isError,
  errorMessage,
  children,
}) => {
  const styles = makeStyles();

  const renderMetrics = () => {
    const defaultAlert = (
      <Box sx={styles.defaultErrorAlert}>
        <DefaultAlert dataTestId={PERFORMANCE_TEST_IDS.DEFAULT_ERROR_ALERT} />
      </Box>
    );

    if (isLoading) {
      return (
        <Skeleton
          data-testid={PERFORMANCE_TEST_IDS.PLACEHOLDER}
          variant={'rectangular'}
          sx={styles.placeholder}
        />
      );
    }

    if (errorMessage) {
      return (
        <Box sx={styles.defaultAlertContainer}>
          <InfoOutlinedIcon sx={styles.infoIcon} />
          <Typography
            sx={styles.defaultText}
            data-testid={PERFORMANCE_TEST_IDS.METRICS_ERROR_ALERT}
          >
            {errorMessage}
          </Typography>
        </Box>
      );
    }

    if (isError) {
      return defaultAlert;
    }

    return (
      <Grid
        container
        rowSpacing={{ xs: 2, sm: 0 }}
        spacing={{ xs: 0, sm: 2 }}
        sx={styles.metricsContainer}
      >
        {children}
      </Grid>
    );
  };

  return (
    <MetricsSection
      testIdPrefix={PERFORMANCE_TEST_IDS.SECTION}
      title={title}
      icon={<PersonIcon color="primary" />}
    >
      {renderMetrics()}
    </MetricsSection>
  );
};

export default PerformanceContainer;
