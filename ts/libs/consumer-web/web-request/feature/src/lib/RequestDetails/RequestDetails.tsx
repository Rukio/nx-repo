import { FC } from 'react';
import {
  Grid,
  Typography,
  FormHelperText,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineContent,
  CheckCircleOutlineIcon,
  theme,
  SxProps,
  Theme,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { PageLayout } from '../components/PageLayout';
import { getVisitDay } from '../utils';
import { REQUEST_DETAILS_TEST_IDS } from './testIds';
import { SessionStorageKeys } from '../constants';

const makeStyles = () =>
  makeSxStyles({
    timelineRoot: {
      margin: 0,
      paddingTop: 0,
      paddingLeft: 0,
    },
    timelineItemRoot: {
      '&:before': {
        display: 'none',
      },
      paddingTop: theme.spacing(4),
    },
    timelineDotRoot: {
      width: 16,
      height: 16,
      padding: 0,
      border: 0,
      boxShadow: 'none',
      '& svg': {
        width: 20,
        height: 20,
        color: theme.palette.success.main,
      },
    },
    timeLineSuccess: {
      backgroundColor: 'transparent',
      width: 20,
      height: 20,
    },
    timeLineInProgress: {
      backgroundColor: `${theme.palette.primary.main}`,
    },
    successTitle: {
      color: theme.palette.success.main,
    },
    inProgressTitle: {
      color: theme.palette.primary.main,
    },
    emergency: {
      color: `${theme.palette.error.main}`,
      textAlign: 'left',
      mt: 2,
    },
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      paddingY: theme.spacing(2),
    },
    wrapperItem: {
      borderRadius: '8px',
      border: `1px solid ${theme.palette.grey[200]}`,
      background: theme.palette.background.paper,
      padding: theme.spacing(3),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3, 2),
        maxWidth: `calc(100vw - ${theme.spacing(4)})`,
      },
    },
  });

const RequestDetails: FC = () => {
  const preferredEtaStart =
    window.sessionStorage.getItem(SessionStorageKeys.PreferredEtaStart) || '';
  const styles = makeStyles();

  return (
    <PageLayout layoutSize="sm" disableChildrenWrapper>
      <Grid sx={styles.wrapper} container>
        <Grid sx={styles.wrapperItem} item sm={12}>
          <Typography
            variant="h4"
            data-testid={
              REQUEST_DETAILS_TEST_IDS.SUCCESSFUL_SUBMISSION_WITHOUTCALL_ALERT
            }
          >
            Thanks! Your request was submitted!
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 2.5 }}
            data-testid={REQUEST_DETAILS_TEST_IDS.CARE_TEAM_MEMBER_MESSAGE}
          >
            Our next available Care Team member will give you a call shortly. It
            may take a bit longer depending on request volume.
          </Typography>
          <FormHelperText
            sx={styles.emergency}
            data-testid={REQUEST_DETAILS_TEST_IDS.EMERGENCY_DISCLAIMER_MESSAGE}
          >
            If this is an emergency, please call 911.
          </FormHelperText>
        </Grid>
        <Grid sx={styles.wrapperItem} item sm={12}>
          <Typography
            variant="h6"
            data-testid={REQUEST_DETAILS_TEST_IDS.WHAT_COMES_NEXT_HEADER}
          >
            What Comes Next
          </Typography>
          <Timeline
            sx={styles.timelineRoot}
            data-testid={
              REQUEST_DETAILS_TEST_IDS.VISIT_TIMELINE_WITHOUTCALL_FORM
            }
          >
            <TimelineItem sx={styles.timelineItemRoot}>
              <TimelineSeparator>
                <TimelineDot
                  sx={
                    [
                      styles.timelineDotRoot,
                      styles.timeLineSuccess,
                    ] as SxProps<Theme>
                  }
                >
                  <CheckCircleOutlineIcon />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography sx={styles.successTitle}>
                  Visit requested!
                </Typography>
                <FormHelperText>We’re reviewing your request.</FormHelperText>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem sx={styles.timelineItemRoot}>
              <TimelineSeparator>
                <TimelineDot
                  sx={
                    [
                      styles.timelineDotRoot,
                      styles.timeLineInProgress,
                    ] as SxProps<Theme>
                  }
                />
              </TimelineSeparator>
              <TimelineContent>
                <Typography sx={styles.inProgressTitle}>
                  We’ll call to confirm your visit
                </Typography>
                <FormHelperText>
                  A member of our team will call to confirm your details and
                  schedule your visit
                </FormHelperText>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem sx={styles.timelineItemRoot}>
              <TimelineSeparator>
                <TimelineDot sx={styles.timelineDotRoot} />
              </TimelineSeparator>
              <TimelineContent>
                {`We’ll come to your home ${getVisitDay(preferredEtaStart)}`}
                <FormHelperText>
                  Our fully-equipped medical team will come right to your door
                  and provide care in the comfort of your home
                </FormHelperText>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </Grid>
      </Grid>
    </PageLayout>
  );
};

export default RequestDetails;
