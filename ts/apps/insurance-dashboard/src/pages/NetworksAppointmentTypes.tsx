import { NetworksAppointmentTypes } from '@*company-data-covered*/insurance/feature';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from './testIds';
import { Box } from '@*company-data-covered*/design-system';

const NetworksAppointmentTypesPage = () => {
  return (
    <Box
      data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_APPOINTMENT_TYPES}
    >
      <NetworksAppointmentTypes />
    </Box>
  );
};

export default NetworksAppointmentTypesPage;
