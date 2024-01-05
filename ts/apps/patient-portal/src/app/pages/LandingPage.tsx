import { Grid } from '@*company-data-covered*/design-system';
import {
  MySettingsSection,
  OtherPatientsSection,
  SavedAddresses,
} from '@*company-data-covered*/patient-portal/feature';
import { Page } from '@*company-data-covered*/patient-portal/ui';

export const LANDING_PAGE_TEST_ID_PREFIX = 'landing-page';

export const LandingPage = () => (
  <Page testIdPrefix={LANDING_PAGE_TEST_ID_PREFIX}>
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <MySettingsSection />
      </Grid>
      <Grid item>
        <OtherPatientsSection />
      </Grid>
      <Grid item>
        <SavedAddresses />
      </Grid>
    </Grid>
  </Page>
);

export default LandingPage;
