import {
  Box,
  Typography,
  Container,
  Paper,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { AppBar, NavigationTabs } from '@*company-data-covered*/modality/ui';
import {
  MarketsConfiguration,
  InsurancesConfiguration,
  ModalityControls,
  NetworksConfiguration,
  INSURANCE_RESTRUCTURE_FEATURE_GATE_NAME,
} from '@*company-data-covered*/modality/feature';
import statsig from 'statsig-js';

import { environment } from '../../environments/environment';

const makeStyles = () =>
  makeSxStyles({
    pageTitle: {
      pl: 4,
      mb: 1,
      fontWeight: 700,
    },
    configurationContainer: {
      p: 3,
      my: 4,
    },
    tabsContainer: {
      pt: 3,
      backgroundColor: 'background.paper',
    },
  });

const Dashboard = () => {
  const classes = makeStyles();
  const { stationURL } = environment;
  const isInsuranceRestructureEnabled = statsig.checkGate(
    INSURANCE_RESTRUCTURE_FEATURE_GATE_NAME
  );

  return (
    <Box>
      <AppBar stationURL={stationURL} />
      <Box sx={classes.tabsContainer}>
        <Typography variant="h6" component="h1" sx={classes.pageTitle}>
          Market Configuration
        </Typography>
        <NavigationTabs stationURL={stationURL} />
      </Box>
      <Container>
        <Paper sx={classes.configurationContainer}>
          <MarketsConfiguration />
        </Paper>
        <Paper sx={classes.configurationContainer}>
          {isInsuranceRestructureEnabled ? (
            <NetworksConfiguration />
          ) : (
            <InsurancesConfiguration />
          )}
        </Paper>
        <ModalityControls />
      </Container>
    </Box>
  );
};

export default Dashboard;
