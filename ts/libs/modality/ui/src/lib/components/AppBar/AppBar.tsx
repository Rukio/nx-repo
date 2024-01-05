import { Box, Button, makeSxStyles } from '@*company-data-covered*/design-system';
import { APP_BAR_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    root: {
      borderBottom: '1px solid',
      borderColor: 'divider',
      py: 1.25,
      pl: 3,
      backgroundColor: 'background.paper',
    },
    dashboardUrl: {
      textTransform: 'capitalize',
      fontSize: '1.25rem',
      lineHeight: 1,
      '&:hover, &:active': {
        backgroundColor: 'initial',
      },
    },
  });

const AppBar = ({ stationURL }: { stationURL: string }) => {
  const styles = makeStyles();

  return (
    <Box sx={styles.root}>
      <Button
        sx={styles.dashboardUrl}
        href={stationURL}
        variant="text"
        data-testid={APP_BAR_TEST_IDS.STATION_LINK}
      >
        Dashboard
      </Button>
    </Box>
  );
};

export default AppBar;
