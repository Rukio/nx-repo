import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ChevronRightIcon,
  List,
  ListItem,
  LocalPhoneIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  VISIT_EPISODE_VISITS,
  useAnalytics,
  useFeatureFlagVisitScheduling,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  useGetEpisodeVisits,
  useGetPatient,
  useGetServiceLines,
  useGetUsers,
} from '@*company-data-covered*/caremanager/data-access';
import {
  Episode,
  VisitListElement,
  VisitStatusGroup,
} from '@*company-data-covered*/caremanager/data-access-types';
import { SchedulingModalButton } from '@*company-data-covered*/caremanager/feature-scheduling-modal';
import {
  CallVisitFormModal,
  VisitCard,
} from '@*company-data-covered*/caremanager/feature-visit';
import testIds from './EpisodeVisits.testIds';
import {
  sortActiveVisits,
  sortPastVisits,
  sortUpcomingVisits,
} from '../../visitSortingHelpers';

const styles = makeSxStyles({
  accordion: {
    '&': {
      background: 'inherit',
      boxShadow: 'none',
    },
    '&::before': {
      background: 'inherit',
    },
    '&.Mui-expanded, & .MuiAccordionSummary-content': {
      margin: 0,
    },
  },
  accordionDetails: {
    '&.MuiAccordionDetails-root': {
      paddingTop: '0',
      paddingBottom: '0',
    },
  },
  chevronBox: {
    alignItems: 'center',
    display: 'flex',
    '&.Mui-expanded': {
      minHeight: '48px',
    },
    '&.MuiAccordionSummary-root.Mui-expanded': {
      paddingBottom: '0',
    },
    '& .MuiAccordionSummary-content.Mui-expanded': {
      margin: '12px 0',
    },
  },
  chevron: {
    marginRight: '8px',
    width: '20px',
    height: '20px',
  },
  registerCallButtonBox: {
    display: 'flex',
    justifyContent: 'right',
    marginBottom: '8px',
  },
  actionButtonsBox: {
    display: 'flex',
    justifyContent: 'right',
    marginBottom: '8px',
  },
  viewBox: {
    background: (theme) => theme.palette.background.default,
    padding: {
      xs: '32px',
      lg: '32px 10%',
    },
  },
  list: {
    padding: 0,
  },
  listItem: {
    display: 'block',
    marginBottom: 1.5,
  },
});

interface EpisodeVisitsListProps {
  episode: Episode;
}

interface EpisodeVisitsListSectionProps {
  dataTestId?: string;
  title: string;
  visits: VisitListElement[];
  episodeId: string;
  serviceLineName?: string;
}

const EpisodeVisitsListSection: React.FC<EpisodeVisitsListSectionProps> = ({
  dataTestId,
  title,
  visits,
  serviceLineName,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Accordion
      data-testid={dataTestId}
      expanded={isExpanded}
      sx={styles.accordion}
    >
      <AccordionSummary
        data-testid={`${testIds.EPISODE_VISITS_SECTION_ACCORDION_SUMMARY_PREFIX}${dataTestId}`}
        onClick={() => {
          setIsExpanded((value) => !value);
        }}
      >
        <Box sx={styles.chevronBox}>
          <ChevronRightIcon
            sx={styles.chevron}
            transform={isExpanded ? 'rotate(270)' : 'rotate(90)'}
          />
          <Typography variant="h5">{title}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={styles.accordionDetails}>
        <List sx={styles.list}>
          {visits.length ? (
            visits.map((visit) => (
              <ListItem
                data-testid={`${testIds.VISIT_LIST_ITEM_PREFIX}${dataTestId}-${visit.id}`}
                disableGutters
                disablePadding
                key={visit.id}
                sx={styles.listItem}
              >
                <VisitCard
                  visit={visit}
                  serviceLineName={serviceLineName}
                  isEditable
                />
              </ListItem>
            ))
          ) : (
            <Typography
              data-testid={`${dataTestId}-${testIds.EPISODE_VISITS_EMPTY_SECTION}`}
              variant="body2"
            >
              There are no {title} for this Episode.
            </Typography>
          )}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

const EpisodeVisitsList: React.FC<EpisodeVisitsListProps> = ({ episode }) => {
  const [isNewCallModalOpen, setNewCallModalOpen] = useState(false);
  const { id: episodeId, marketId, serviceLineId } = episode;
  const { data: episodeVisitsData, isLoading } = useGetEpisodeVisits({
    episodeId,
  });
  const patient = useGetPatient(episode.patientId);
  const [getServiceLine] = useGetServiceLines();
  const serviceLine = getServiceLine(serviceLineId);
  const visitSchedulingAvailable = useFeatureFlagVisitScheduling();
  const { trackPageViewed } = useAnalytics();

  const canScheduleVisits = Boolean(
    episodeVisitsData?.visits?.length && visitSchedulingAvailable
  );

  useEffect(() => {
    // TODO(CO-1518): Add previous page as second argument
    trackPageViewed(VISIT_EPISODE_VISITS);
  }, [trackPageViewed]);

  const providerIds = episodeVisitsData?.visits?.reduce<string[]>(
    (ids, visit) => {
      if (visit.providerUserIds?.length) {
        return [...ids, ...visit.providerUserIds];
      } else if (visit.createdByUserId) {
        return [...ids, visit.createdByUserId];
      } else {
        return ids;
      }
    },
    []
  );

  useGetUsers(providerIds);

  if (isLoading) {
    return null;
  }

  const visitsByStatusGroup = (episodeVisitsData?.visits || []).reduce(
    (acc, visit) => {
      if (visit.statusGroup) {
        acc[visit.statusGroup].push(visit);
      } else {
        acc[VisitStatusGroup.Unspecified].push(visit);
      }

      return acc;
    },
    {
      [VisitStatusGroup.Active]: [],
      [VisitStatusGroup.Upcoming]: [],
      [VisitStatusGroup.Past]: [],
      [VisitStatusGroup.Unspecified]: [],
    } as Record<VisitStatusGroup, VisitListElement[]>
  );

  return (
    <Box data-testid={testIds.EPISODE_VISITS_BOX} paddingBottom="32px">
      <Box sx={styles.viewBox}>
        <Box sx={styles.actionButtonsBox}>
          <Box marginRight="16px">
            <Button
              variant="outlined"
              onClick={() => setNewCallModalOpen(true)}
              startIcon={<LocalPhoneIcon />}
            >
              Register Call
            </Button>
          </Box>
          {canScheduleVisits && patient.data?.patient && (
            <SchedulingModalButton
              episodeId={episodeId}
              marketId={marketId}
              patient={patient.data.patient}
              serviceLineId={episode.serviceLineId}
            />
          )}
          <CallVisitFormModal
            episodeId={episodeId}
            isOpen={isNewCallModalOpen}
            onClose={() => setNewCallModalOpen(false)}
          />
        </Box>
        <EpisodeVisitsListSection
          dataTestId={testIds.ACTIVE_VISITS_SECTION}
          title="Active Visits"
          visits={sortActiveVisits(
            visitsByStatusGroup.VISIT_STATUS_GROUP_ACTIVE
          )}
          episodeId={episodeId}
          serviceLineName={serviceLine?.name}
        />
        <EpisodeVisitsListSection
          dataTestId={testIds.UPCOMING_VISITS_SECTION}
          title="Upcoming Visits"
          visits={sortUpcomingVisits(
            visitsByStatusGroup.VISIT_STATUS_GROUP_UPCOMING
          )}
          episodeId={episodeId}
          serviceLineName={serviceLine?.name}
        />
        <EpisodeVisitsListSection
          dataTestId={testIds.PAST_VISITS_SECTION}
          title="Past Visits"
          visits={sortPastVisits(visitsByStatusGroup.VISIT_STATUS_GROUP_PAST)}
          episodeId={episodeId}
          serviceLineName={serviceLine?.name}
        />
      </Box>
    </Box>
  );
};

export default EpisodeVisitsList;
