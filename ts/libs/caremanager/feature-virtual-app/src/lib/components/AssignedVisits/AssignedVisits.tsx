import { useMemo } from 'react';
import { Grid } from '@*company-data-covered*/design-system';
import { useGetVirtualAppVisits } from '@*company-data-covered*/caremanager/data-access';

import { SidePanel, usePanelContext } from '../SidePanel';
import { AssignedVisitsHeader } from './AssignedVisitsHeader';
import { ASSIGNED_VISITS_TEST_IDS } from './testIds';
import { VisitsAccordion } from './VisitsAccordion';

export const AssignedVisits = () => {
  const {
    isSidePanelOpen = false,
    closeSidePanel,
    selectedVisitId,
  } = usePanelContext();

  // TODO: PE-2563 - provide real props to the BE endpoint
  const { data: virtualAppVisits } = useGetVirtualAppVisits({
    shiftTeamId: '123',
    userId: '12839031',
    marketIds: ['198'],
  });

  const assignedVirtualVisits = virtualAppVisits?.assigned;

  const onSceneVisits = useMemo(() => {
    return assignedVirtualVisits?.filter(
      (virtualVisit) => virtualVisit.visit?.status === 'on_scene'
    );
  }, [assignedVirtualVisits]);

  const onRouteVisits = useMemo(() => {
    return assignedVirtualVisits?.filter(
      (virtualVisit) => virtualVisit.visit?.status === 'on_route'
    );
  }, [assignedVirtualVisits]);

  const sidePanelVisit = useMemo(() => {
    return assignedVirtualVisits?.find(
      (virtualVisit) => virtualVisit?.visit?.id === selectedVisitId
    );
  }, [assignedVirtualVisits, selectedVisitId]);

  return (
    <Grid data-testid={ASSIGNED_VISITS_TEST_IDS.ROOT} flex={1}>
      {
        // TODO: PE-2543 - apply real handlers to the buttons
      }
      <AssignedVisitsHeader
        onOnCallDoctorsClick={() => console.log('TODO: PE-2543')}
        onOpenAthenaClick={() => console.log('TODO: PE-2543')}
        onOpenTytoCareClick={() => console.log('TODO: PE-2543')}
      />
      <VisitsAccordion
        visits={onSceneVisits}
        header="On Scene"
        testIdPrefix="onScene"
        defaultExpanded
      />
      <VisitsAccordion
        visits={onRouteVisits}
        header="On Route"
        testIdPrefix="enRoute"
      />
      {sidePanelVisit && (
        <SidePanel
          virtualVisit={sidePanelVisit}
          isOpen={isSidePanelOpen}
          onClose={closeSidePanel}
        />
      )}
    </Grid>
  );
};
