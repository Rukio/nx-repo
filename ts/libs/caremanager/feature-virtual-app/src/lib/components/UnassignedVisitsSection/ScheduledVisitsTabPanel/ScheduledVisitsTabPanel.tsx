import { Grid } from '@*company-data-covered*/design-system';
import { VirtualAPPVisit } from '@*company-data-covered*/caremanager/data-access-types';
import { SCHEDULED_VISITS_TAB_TEST_IDS } from '../testIds';
import { VisitCard } from '../../VisitCard';

interface ScheduledVisitsTabPanelProps {
  scheduledVisits?: VirtualAPPVisit[];
}

export const ScheduledVisitsTabPanel = ({
  scheduledVisits,
}: ScheduledVisitsTabPanelProps) => {
  if (!scheduledVisits) {
    return null;
  }

  return (
    <Grid data-testid={SCHEDULED_VISITS_TAB_TEST_IDS.CONTAINER}>
      {scheduledVisits?.map(({ visit, patient, episode }) => (
        <VisitCard
          key={`key-${visit?.id}`}
          visit={visit}
          episode={episode}
          patient={patient}
        />
      ))}
    </Grid>
  );
};
