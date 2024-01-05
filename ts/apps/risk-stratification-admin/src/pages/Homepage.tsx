import { Box, makeSxStyles, Typography } from '@*company-data-covered*/design-system';
import { NavigationTabs } from '@*company-data-covered*/risk-stratification-admin/ui';

const makeStyles = () =>
  makeSxStyles({
    titleWrapper: { marginTop: 2 },
    title: { paddingY: '9px', paddingX: 4 },
  });

const RiskStratAdminHomepage = () => {
  const styles = makeStyles();

  return (
    <Box sx={styles.titleWrapper} data-testid="homepage">
      <Typography variant="h5" sx={styles.title}>
        Risk Stratification
      </Typography>

      <NavigationTabs />
    </Box>
  );
};

export default RiskStratAdminHomepage;
