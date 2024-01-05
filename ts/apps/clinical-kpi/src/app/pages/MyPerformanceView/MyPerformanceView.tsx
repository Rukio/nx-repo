import { Box } from '@*company-data-covered*/design-system';
import {
  Header,
  MyPerformance,
  PeerRankings,
} from '@*company-data-covered*/clinical-kpi/feature';

type MyPerformanceViewProps = {
  stationURL?: string;
};

const MyPerformanceView = ({ stationURL }: MyPerformanceViewProps) => {
  return (
    <>
      <Box mt={4}>
        <Header stationURL={stationURL} />
      </Box>
      <Box mt={4}>
        <MyPerformance />
      </Box>
      <Box mt={4}>
        <PeerRankings />
      </Box>
    </>
  );
};

export default MyPerformanceView;
