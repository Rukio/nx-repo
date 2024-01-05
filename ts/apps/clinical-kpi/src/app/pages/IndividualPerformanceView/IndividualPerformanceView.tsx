import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@*company-data-covered*/design-system';
import {
  IndividualPerformanceHeader,
  ProviderPerformanceMetrics,
  ProviderShiftsTable,
  ProviderVisits,
} from '@*company-data-covered*/clinical-kpi/feature';
import { INDIVIDUAL_PERFORMANCE_VIEW_TEST_ID } from './testIds';
import { CLINICAL_KPI_ROUTES, LeadsProvidersPathParams } from '../../constants';

const IndividualPerformanceView: FC = () => {
  const { id = '' } = useParams<LeadsProvidersPathParams>();

  return (
    <>
      <IndividualPerformanceHeader
        providerId={id}
        backButtonLink={CLINICAL_KPI_ROUTES.LEADER_HUB}
      />
      <Box mt={4}>
        <ProviderPerformanceMetrics providerId={id} />
      </Box>
      <Box mt={4} data-testid={INDIVIDUAL_PERFORMANCE_VIEW_TEST_ID}>
        <ProviderVisits providerId={id} />
        <ProviderShiftsTable providerId={id} />
      </Box>
    </>
  );
};

export default IndividualPerformanceView;
