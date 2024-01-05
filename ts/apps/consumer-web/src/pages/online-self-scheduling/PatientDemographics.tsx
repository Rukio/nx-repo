import { PatientDemographics } from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';
import { Box } from '@*company-data-covered*/design-system';
import { ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS } from './testIds';

const PatientDemographicsPage = () => (
  <Box data-testid={ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.PATIENT_DEMOGRAPHICS}>
    <PatientDemographics />
  </Box>
);

export default PatientDemographicsPage;
