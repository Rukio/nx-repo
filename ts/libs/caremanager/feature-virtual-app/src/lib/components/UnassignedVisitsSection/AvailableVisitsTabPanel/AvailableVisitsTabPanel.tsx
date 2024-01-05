import { Grid } from '@*company-data-covered*/design-system';
import { VirtualAPPVisit } from '@*company-data-covered*/caremanager/data-access-types';
import { AVAILABLE_VISITS_TAB_TEST_IDS } from '../testIds';
import { VisitCard } from '../../VisitCard';

interface AvailableVisitsTabPanelProps {
  availableVisits?: VirtualAPPVisit[];
}

export const AvailableVisitsTabPanel = ({
  availableVisits,
}: AvailableVisitsTabPanelProps) => {
  if (!availableVisits) {
    return null;
  }

  return (
    <Grid data-testid={AVAILABLE_VISITS_TAB_TEST_IDS.CONTAINER}>
      {availableVisits.map(({ visit, episode, patient }) => (
        <VisitCard
          key={`key-${visit?.id}`}
          visit={visit}
          episode={episode}
          patient={patient}
          isAssignable
        />
      ))}
    </Grid>
  );
};
