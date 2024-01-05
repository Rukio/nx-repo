import { Link, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  AddIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useUserRoles } from '@*company-data-covered*/auth0/feature';
import { UserRoles } from '@*company-data-covered*/auth0/util';
import { INSURANCE_DASHBOARD_ROUTES, PayerPathParams } from '../constants';
import { NetworksFilters } from '../NetworksFilters';
import { PAYERS_NETWORKS_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    headContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      mt: 2,
    },
    addNetworkButton: {
      my: 1,
    },
  });

const NetworkControls = () => {
  const styles = makeStyles();
  const { payerId = '' } = useParams<PayerPathParams>();
  const [isInsuranceAdmin] = useUserRoles([UserRoles.INSURANCE_ADMIN]);

  return (
    <Box sx={styles.headContainer}>
      <NetworksFilters />
      <Button
        sx={styles.addNetworkButton}
        data-testid={PAYERS_NETWORKS_TEST_IDS.ADD_NETWORK_BUTTON}
        variant="contained"
        startIcon={<AddIcon />}
        component={Link}
        to={INSURANCE_DASHBOARD_ROUTES.getPayerNetworksCreatePath(payerId)}
        disabled={!isInsuranceAdmin}
      >
        Add Network
      </Button>
    </Box>
  );
};

export default NetworkControls;
