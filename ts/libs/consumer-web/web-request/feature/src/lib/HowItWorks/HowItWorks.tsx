import { FC, useEffect } from 'react';
import {
  ArrowForwardIcon,
  Box,
  Button,
  CheckIcon,
  LocationOnIcon,
  makeSxStyles,
  Paper,
  ShowChartIcon,
  SxProps,
  Theme,
  theme,
  Typography,
  useMediaQuery,
} from '@*company-data-covered*/design-system';
import {
  StatsigEvents,
  StatsigActions,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import statsig from 'statsig-js';
import { QueryParamKeys } from '../constants';
import { getMarketNameFromHowItWorksConfig } from '../utils';
import { useRequestStepper } from '../hooks';
import { HOW_IT_WORKS_TEST_IDS } from './testIds';
import { PageLayout } from '../components/PageLayout';
import {
  StayHomeImage,
  StayHomeMobileImage,
} from '@*company-data-covered*/consumer-web/web-request/ui';
import { useNavigate, useSearchParams } from 'react-router-dom';

const makeStyles = () =>
  makeSxStyles({
    root: {
      backgroundColor: theme.palette.background.default,
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      overflow: 'auto',
      letterSpacing: 'normal',
    },
    title: {
      typography: { xs: 'h4', sm: 'h2' },
      fontWeight: { xs: 700, sm: 700 },
    },
    titleMain: {
      color: theme.palette.primary.main,
    },
    subtitle: {
      px: { xs: 2, sm: 0 },
      mt: 2,
    },
    section: {
      p: {
        xs: theme.spacing(3, 2),
        sm: 3,
      },
      border: `1px solid ${theme.palette.grey[200]}`,
    },
    iconWrapper: {
      fontSize: 16,
    },
    locationIcon: {
      color: theme.palette.action.active,
    },
    stayHomeImageWrapper: {
      width: '100%',
      mt: 3,
      '& video, & img': {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
      },
    },
  });

const REASONS = [
  'No more waiting rooms. We bring the doctor’s office to you.',
  'We’re in-network with most insurance companies (including Medicare/ Medicare Advantage). The cost to you is the same as an urgent care.',
  'We treat everything an urgent care can - and more.',
];

const getMarketNameFromQuery = (utmCampaign: string | null) => {
  if (!utmCampaign) {
    return '';
  }
  const firstDelimiterIndex = utmCampaign.indexOf('-');

  return (
    utmCampaign.substring(firstDelimiterIndex + 1, firstDelimiterIndex + 4) ??
    ''
  );
};

const getMarketName = (utmCampaign: string | null) => {
  const marketQueryParam = getMarketNameFromQuery(utmCampaign);

  return getMarketNameFromHowItWorksConfig(marketQueryParam);
};

const HowItWorks: FC = () => {
  const styles = makeStyles();
  const isSmBreakPoint = useMediaQuery(theme.breakpoints.down('sm'));
  const stepData = useRequestStepper();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    statsig.logEvent(
      StatsigEvents.REQUEST_HOW_IT_WORKS_EVENT,
      StatsigActions.WEB_REQUEST_TYPE,
      {
        page: StatsigPageCategory.REQUEST_HOW_IT_WORKS,
        origin: window.location.host,
      }
    );
  }, []);

  const onBookAppointmentClick = () => {
    navigate(stepData.nextStepUrl);
  };

  const marketName = getMarketName(
    searchParams.get(QueryParamKeys.UtmCampaign)
  );

  return (
    <Box sx={styles.root}>
      <PageLayout
        disableChildrenWrapper
        showProgressBar={false}
        show911Message={false}
        disableLayoutGutters
      >
        <Typography
          sx={styles.title}
          align="center"
          data-testid={HOW_IT_WORKS_TEST_IDS.TITLE}
        >
          <Box component="span" sx={styles.titleMain}>
            Healthcare in your home.
          </Box>{' '}
          On your terms.
        </Typography>
        <Typography
          align="center"
          fontSize={14}
          sx={styles.subtitle}
          data-testid={HOW_IT_WORKS_TEST_IDS.SUBTITLE}
        >
          Schedule a visit and our fully-equipped medical team will come right
          to your door.
        </Typography>
        <Paper elevation={0} sx={[styles.section, { mt: 3 }] as SxProps<Theme>}>
          {marketName && (
            <Box display="flex" alignItems="center">
              <LocationOnIcon
                sx={[styles.iconWrapper, styles.locationIcon] as SxProps<Theme>}
              />
              <Typography sx={{ ml: 1 }} variant="h6">
                {marketName}
              </Typography>
            </Box>
          )}
          <Box display="flex" alignItems="center" sx={{ mt: 0.5 }}>
            <ShowChartIcon
              color="success"
              sx={[styles.iconWrapper] as SxProps<Theme>}
            />
            <Typography sx={{ ml: 1 }} variant="body2" color="success.dark">
              Appointments today are booking fast!
            </Typography>
          </Box>
          <Button
            fullWidth
            sx={{ mt: 3 }}
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={onBookAppointmentClick}
            data-testid={HOW_IT_WORKS_TEST_IDS.BOOK_APPOINTMENT_BTN}
          >
            Book an Appointment Today
          </Button>
        </Paper>
        <Paper elevation={0} sx={[styles.section, { mt: 2 }] as SxProps<Theme>}>
          <Typography color="primary" variant="h4">
            Stay home. Feel better.
          </Typography>
          <Box sx={styles.stayHomeImageWrapper}>
            <img
              src={isSmBreakPoint ? StayHomeMobileImage : StayHomeImage}
              alt="stay home"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            {REASONS.map((reason) => (
              <Box key={`reason-item-${reason}`} sx={{ mt: 1 }} display="flex">
                <CheckIcon color="info" />
                <Typography sx={{ ml: 2 }} variant="body2">
                  {reason}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </PageLayout>
    </Box>
  );
};

export default HowItWorks;
