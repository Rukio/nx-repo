import { FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowBackIcon,
  Box,
  Button,
  Container,
  Avatar,
  makeSxStyles,
  Typography,
  Skeleton,
} from '@*company-data-covered*/design-system';
import { DefaultAlert } from '@*company-data-covered*/clinical-kpi/ui';
import {
  ProfilePosition,
  selectIndividualPerformancePosition,
  setProviderPosition,
  useGetLeaderHubProviderMetricsQuery,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { getNumericMetricValue } from '../util/metricUtils';
import { appConfiguration, dhmtConfiguration } from './constants';
import { INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS } from './TestIds';

type IndividualPerformanceHeaderProps = {
  providerId: string;
  backButtonLink: string;
};

const makeStyles = () =>
  makeSxStyles({
    container: (theme) => ({
      backgroundColor: theme.palette.common.white,
      mt: 2,
      pt: 2,
      pb: 2,
    }),
    textSecondary: (theme) => ({
      color: theme.palette.text.secondary,
    }),
    bioInfoContainer: {
      display: 'flex',
      mt: 2,
      mb: 2,
    },
    avatar: {
      width: 56,
      height: 56,
    },
    bioTextContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    bioName: (theme) => ({
      borderRight: '1px solid',
      borderRightColor: theme.palette.text.secondary,
      pr: 2,
    }),
    bioText: {
      ml: 2,
      lineHeight: 1,
    },
    metricsContainer: {
      display: 'flex',
      gap: 4,
    },
  });

const IndividualPerformanceHeader: FC<IndividualPerformanceHeaderProps> = ({
  providerId,
  backButtonLink,
}) => {
  const styles = makeStyles();
  const {
    data: providerOverallMetrics,
    isError,
    isLoading,
  } = useGetLeaderHubProviderMetricsQuery(providerId);

  const position = useSelector(selectIndividualPerformancePosition);

  const dispatch = useDispatch();

  const { firstName, lastName, avatarUrl, profile } =
    providerOverallMetrics?.provider || {};

  useEffect(() => {
    if (profile?.position && position !== profile?.position) {
      dispatch(setProviderPosition(profile.position as ProfilePosition));
    }
  }, [dispatch, profile?.position, position]);

  if (isError || (!providerOverallMetrics && !isLoading)) {
    return (
      <DefaultAlert
        dataTestId={INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.DEFAULT_ERROR_ALERT}
      />
    );
  }
  const configuration =
    profile?.position === ProfilePosition.Dhmt
      ? dhmtConfiguration
      : appConfiguration;

  return (
    <Box sx={styles.container}>
      <Container>
        <Button
          href={backButtonLink}
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={styles.textSecondary}
        >
          <Typography
            variant="label"
            data-testid={INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.TITLE}
          >
            Performance Hub
          </Typography>
        </Button>
        <Box sx={styles.bioInfoContainer}>
          <Avatar src={avatarUrl} sx={styles.avatar} />
          <Box sx={styles.bioTextContainer}>
            <Typography sx={[styles.bioText, styles.bioName]}>
              {firstName} {lastName}
            </Typography>
            <Typography sx={styles.bioText}>{profile?.position}</Typography>
          </Box>
        </Box>
        <Box sx={styles.metricsContainer}>
          {configuration.map(({ label, property, unit, type }) =>
            isLoading ? (
              <Skeleton
                key={property}
                variant="rectangular"
                data-testid={INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.getMetricSkeleton(
                  type
                )}
              />
            ) : (
              <Box key={property}>
                <Typography variant="overline" sx={styles.textSecondary}>
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  data-testid={INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.getHeaderTestId(
                    property
                  )}
                >
                  {getNumericMetricValue(
                    providerOverallMetrics[property],
                    type
                  )}
                  {unit}
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default IndividualPerformanceHeader;
