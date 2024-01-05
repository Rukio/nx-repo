import { Grid } from '@*company-data-covered*/design-system';
import {
  AssignedVisits,
  SidePanelProvider,
  UnassignedVisitsSection,
} from './components';

export const VirtualAppPage = () => {
  return (
    <SidePanelProvider>
      <Grid container data-testid="caremanager-virtual-app-page-container">
        <UnassignedVisitsSection />
        <AssignedVisits />
      </Grid>
    </SidePanelProvider>
  );
};
