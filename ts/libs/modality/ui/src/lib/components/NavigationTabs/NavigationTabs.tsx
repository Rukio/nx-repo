import { Tabs, Tab, Link, makeSxStyles } from '@*company-data-covered*/design-system';
import { NAVIGATION_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    tabsRoot: {
      pl: 2,
      '& button': {
        textTransform: 'capitalize',
      },
      '& a': {
        color: 'inherit',
        textDecoration: 'none',
      },
    },
  });

const NavigationTabs = ({ stationURL }: { stationURL: string }) => {
  const classes = makeStyles();

  return (
    <Tabs value="modality" sx={classes.tabsRoot}>
      <Tab
        label={
          <Link
            href={`${stationURL}/admin/markets`}
            data-testid={NAVIGATION_TEST_IDS.STATION_MARKETS_LINK}
          >
            Markets
          </Link>
        }
      />
      <Tab
        label={
          <Link
            href={`${stationURL}/admin/states`}
            data-testid={NAVIGATION_TEST_IDS.STATION_STATES_LINK}
          >
            States
          </Link>
        }
      />
      <Tab value="modality" label="Visit Modalities" />
    </Tabs>
  );
};

export default NavigationTabs;
