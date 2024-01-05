import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, Tab, makeSxStyles } from '@*company-data-covered*/design-system';
import { NAVIGATION_BAR_TEST_IDS } from './testIds';

export type NavigationBarTab = {
  link: string;
  label: string;
};

export type NavigationBarProps = {
  currentLocation: string;
  tabs: NavigationBarTab[];
};

const makeStyles = () =>
  makeSxStyles({
    tabsRoot: (theme) => ({
      backgroundColor: theme.palette.common.white,
      pl: 4,
      borderBottom: `1px solid ${theme.palette.grey[100]}`,
      '& button': {
        minWidth: 'max-content',
        p: 0,
        mr: 4,
        textTransform: 'capitalize',
      },
      '& button:last-child': {
        mr: 0,
      },
      '& a': {
        color: 'inherit',
        textDecoration: 'none',
        py: 2,
      },
    }),
  });

const NavigationBar: FC<NavigationBarProps> = ({ currentLocation, tabs }) => {
  const classes = makeStyles();

  const getTabTestId = (tabLabel: string) =>
    NAVIGATION_BAR_TEST_IDS.getTabTestId(tabLabel);

  return (
    <Tabs
      value={currentLocation}
      sx={classes.tabsRoot}
      data-testid={NAVIGATION_BAR_TEST_IDS.ROOT}
    >
      {tabs.map((tab) => {
        const selector = getTabTestId(tab.label);

        return (
          <Tab
            key={selector}
            value={tab.link}
            label={
              <Link to={tab.link} data-testid={selector}>
                {tab.label}
              </Link>
            }
          />
        );
      })}
    </Tabs>
  );
};

export default NavigationBar;
