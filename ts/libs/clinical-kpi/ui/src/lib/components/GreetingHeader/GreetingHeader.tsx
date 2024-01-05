import { FC, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Container,
  Typography,
  Box,
  Link,
  makeSxStyles,
  Skeleton,
  Button,
  ArrowForwardIcon,
} from '@*company-data-covered*/design-system';
import { LEADS_VIEW_INDIVIDUAL_VISIBILITY } from '../../constants';

import {
  AFTERNOON_GREETING,
  EVENING_GREETING,
  MORNING_GREETING,
} from './constants';
import { GREETING_HEADER_TEST_IDS } from './TestIds';
import { getFeatureGate } from '../../utils/statsigUtils';
import { MarketsDropdown } from '../MarketsDropdown';
import { PositionDropdown, ProfilePosition } from '../PositionDropdown';

interface Market {
  name: string;
  id: string;
}

type Props = {
  firstName: string;
  lastUpdated: string;
  learnMoreLink: string;
  visitsCompleted: number;
  isLoading: boolean;
  stationURL: string;
  handleMarketChange?: (marketId: Market['id']) => void;
  handlePositionChange?: (selectedPositionName: ProfilePosition) => void;
  selectedPositionName?: ProfilePosition;
  selectedMarketId?: string;
  isLeadersView?: boolean;
  markets?: Market[];
};

const makeStyles = () =>
  makeSxStyles({
    container: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    greetingContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: (theme) => ({
      color: theme.palette.primary.main,
      fontFamily: 'Bree Serif',
    }),
    lastUpdated: (theme) => ({
      display: 'flex',
      color: theme.palette.text.secondary,
    }),
    visitsCompletedTitle: (theme) => ({
      display: 'flex',
      marginTop: theme.spacing(1.5),
      color: theme.palette.text.primary,
    }),
    performanceTitleWrapper: (theme) => ({
      display: 'flex',
      [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
      },
    }),
    performanceTitle: (theme) => ({
      color: theme.palette.text.secondary,
    }),
    learnMoreLinkWrapper: (theme) => ({
      padding: 0,
      textDecoration: 'none',
      marginTop: theme.spacing(0.5),
      color: theme.palette.primary.main,
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(0.5),
        marginTop: 0,
      },
    }),
    lastUpdatedPlaceholder: {
      width: 150,
      marginLeft: 0.5,
      marginTop: 0.2,
    },
    visitsCompletedPlaceholder: {
      width: 25,
      marginLeft: 0.5,
      marginTop: 0.2,
    },
    buttonToDashboard: {
      padding: 0,
    },
    marketsSelect: (theme) => ({
      display: 'flex',
      minWidth: 200,
      gap: theme.spacing(1),
    }),
  });

const GreetingHeader: FC<Props> = ({
  firstName,
  lastUpdated,
  visitsCompleted,
  isLeadersView = false,
  markets,
  learnMoreLink,
  isLoading,
  stationURL,
  handleMarketChange,
  handlePositionChange,
  selectedPositionName,
  selectedMarketId,
}) => {
  const styles = makeStyles();
  const greetingText = useMemo(() => {
    const currentHours = new Date().getHours();

    if (currentHours < 12) {
      return `${MORNING_GREETING}, ${firstName}`;
    } else if (currentHours < 18) {
      return `${AFTERNOON_GREETING}, ${firstName}`;
    } else {
      return `${EVENING_GREETING}, ${firstName}`;
    }
  }, [firstName]);

  const formattedLastUpdated = useMemo(
    () => lastUpdated && format(new Date(lastUpdated), 'MMMM d, yyyy'),
    [lastUpdated]
  );

  const isLeadsViewIndividualVisibility = useMemo(
    () => getFeatureGate(LEADS_VIEW_INDIVIDUAL_VISIBILITY),
    []
  );

  return (
    <Container sx={styles.container}>
      <Box sx={styles.greetingContainer}>
        {isLeadsViewIndividualVisibility && !isLeadersView && (
          <Box>
            <Button
              href={stationURL}
              sx={styles.buttonToDashboard}
              variant="text"
              size="small"
              endIcon={<ArrowForwardIcon />}
              data-testid={GREETING_HEADER_TEST_IDS.STATION_LINK}
            >
              <Typography
                data-testid={GREETING_HEADER_TEST_IDS.STATION_LINK_LABEL_PREFIX}
              >
                Continue to&nbsp; Dashboard
              </Typography>
            </Button>
          </Box>
        )}
        <Typography
          data-testid={GREETING_HEADER_TEST_IDS.GREETING_TEXT}
          sx={styles.title}
          variant="h3"
        >
          {greetingText}
        </Typography>
        <Typography
          data-testid={GREETING_HEADER_TEST_IDS.LAST_UPDATED_TEXT}
          sx={styles.lastUpdated}
          variant="overline"
        >
          Last Updated:{' '}
          {!isLoading ? (
            formattedLastUpdated
          ) : (
            <Skeleton
              data-testid={GREETING_HEADER_TEST_IDS.LAST_UPDATED_PLACEHOLDER}
              variant={'rectangular'}
              sx={styles.lastUpdatedPlaceholder}
            />
          )}
        </Typography>
        {!isLeadersView && (
          <>
            <Typography
              data-testid={GREETING_HEADER_TEST_IDS.VISITS_COMPLETED_TEXT}
              sx={styles.visitsCompletedTitle}
              variant="h6"
            >
              Visits Completed Last Week:{' '}
              {!isLoading ? (
                visitsCompleted
              ) : (
                <Skeleton
                  data-testid={
                    GREETING_HEADER_TEST_IDS.VISITS_COMPLETED_PLACEHOLDER
                  }
                  variant={'rectangular'}
                  sx={styles.visitsCompletedPlaceholder}
                />
              )}
            </Typography>
            <Box sx={styles.performanceTitleWrapper}>
              <Typography
                data-testid={GREETING_HEADER_TEST_IDS.PERFORMANCE_TEXT}
                sx={styles.performanceTitle}
                variant="caption"
              >
                Performance based on an 80 acute visit trailing average.
              </Typography>
              <Link
                variant="caption"
                data-testid={GREETING_HEADER_TEST_IDS.LEARN_MORE_LINK}
                href={learnMoreLink}
                sx={styles.learnMoreLinkWrapper}
              >
                Learn More
              </Link>
            </Box>
          </>
        )}
      </Box>
      {isLeadersView && markets?.length && selectedPositionName && (
        <Box sx={styles.marketsSelect}>
          <MarketsDropdown
            selectedMarketId={selectedMarketId ?? markets[0].id}
            onMarketChange={handleMarketChange}
            markets={markets}
          />
          <PositionDropdown
            selectedPositionName={selectedPositionName || ProfilePosition.App}
            onPositionChange={handlePositionChange}
          />
        </Box>
      )}
    </Container>
  );
};

export default GreetingHeader;
