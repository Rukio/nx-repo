import { Box } from '@*company-data-covered*/design-system';
import {
  Header,
  MarketPerformance,
  CareTeamRankings,
} from '@*company-data-covered*/clinical-kpi/feature';

type LeadersViewProps = {
  stationURL?: string;
};

const LeadersView = ({ stationURL }: LeadersViewProps) => {
  return (
    <Box mt={4}>
      <Header stationURL={stationURL} isLeadersView={true} />
      <Box mt={4}>
        <MarketPerformance />
      </Box>
      <Box mt={4}>
        <CareTeamRankings />
      </Box>
    </Box>
  );
};

export default LeadersView;
