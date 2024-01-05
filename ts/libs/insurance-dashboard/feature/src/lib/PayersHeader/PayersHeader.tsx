import { useNavigate } from 'react-router-dom';
import { PayersHeader } from '@*company-data-covered*/insurance/ui';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { useUserRoles } from '@*company-data-covered*/auth0/feature';
import { UserRoles } from '@*company-data-covered*/auth0/util';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';

const makeStyles = () =>
  makeSxStyles({
    headerWrapper: {
      mt: 5,
    },
  });

const Header = () => {
  const styles = makeStyles();
  const navigate = useNavigate();
  const onAddInsurancePayer = () =>
    navigate(INSURANCE_DASHBOARD_ROUTES.PAYER_CREATE);
  const [isInsuranceAdmin] = useUserRoles([UserRoles.INSURANCE_ADMIN]);

  return (
    <Box sx={styles.headerWrapper}>
      <PayersHeader
        title="Insurance Payers"
        buttonText="Add Insurance Payer"
        onAddInsurancePayer={onAddInsurancePayer}
        disabled={!isInsuranceAdmin}
      />
    </Box>
  );
};

export default Header;
