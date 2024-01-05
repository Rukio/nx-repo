import { FC, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowForwardIcon,
  Box,
  Button,
  Container,
  Link,
  Typography,
  makeSxStyles,
  SxStylesValue,
} from '@*company-data-covered*/design-system';
import { LEADS_VIEW_INDIVIDUAL_VISIBILITY } from '@*company-data-covered*/clinical-kpi/ui';
import { ReactComponent as *company-data-covered*Logo } from './assets/*company-data-covered*-logo.svg';
import { ReactComponent as KPIDashboardGraphic } from './assets/kpidashboard-graphic.svg';
import { APP_BAR_TEST_IDS } from './TestIds';
import { checkFeatureGate } from '../util/statsigUtils';
import { useUserMarketRolePermission } from '../hooks/useUserMarketRolePermission';
import { ALLOWED_ROLES } from '../constants';

type Props = {
  stationURL: string;
};

type LinkStyles = {
  activeLink: SxStylesValue;
  link: SxStylesValue;
  isActive?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    container: (theme) => ({
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: theme.spacing(4),
    }),
    nav: (theme) => ({
      height: '1rem',
      width: '100%',
      lineHeight: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      [theme.breakpoints.down('sm')]: {
        justifyContent: 'space-between',
      },
    }),
    toDashboardButton: (theme) => ({
      ml: theme.spacing(5),
      textTransform: 'none',
      color: theme.palette.primary.main,
    }),
    toDashboardButtonLabelPrefix: (theme) => ({
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    }),
    kpiDashboardGraphic: (theme) => ({
      position: 'absolute',
      right: 0,
      top: 0,
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    }),
    navigationContainer: {
      display: 'flex',
      gap: 2.5,
      marginLeft: '48px',
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: '600',
    },
    textDecoration: {
      '& a': {
        textDecoration: 'none',
      },
    },
    activeLink: {
      color: 'black',
    },
    link: {
      color: '#9AA3A9',
    },
  });

const navigationLinks = [
  {
    link: '/',
    label: 'My Performance Hub',
  },
  {
    link: '/leads',
    label: 'Leader Hub',
  },
];

const getLinkStyles = ({ isActive, activeLink, link }: LinkStyles) =>
  isActive ? activeLink : link;

const AppBar: FC<Props> = ({ stationURL }) => {
  const styles = makeStyles();

  const { activeLink, link } = styles;

  const showLeadsViewIndividualVisibility =
    useUserMarketRolePermission(ALLOWED_ROLES);

  const isLeadsViewIndividualVisibility = useMemo(
    () => checkFeatureGate(LEADS_VIEW_INDIVIDUAL_VISIBILITY),
    []
  );

  return (
    <Container sx={styles.container}>
      <Box sx={styles.nav} component="nav">
        <Link
          href={stationURL}
          data-testid={APP_BAR_TEST_IDS.DISPATCH_HEALTH_LOGO_LINK}
        >
          <*company-data-covered*Logo />
        </Link>
        {isLeadsViewIndividualVisibility && showLeadsViewIndividualVisibility && (
          <Box sx={styles.navigationContainer}>
            {navigationLinks.map((navLink, index) => (
              <Box sx={styles.textDecoration}>
                <NavLink key={index} to={navLink.link}>
                  {({ isActive }) => (
                    <Box
                      component="span"
                      sx={{
                        ...getLinkStyles({ isActive, activeLink, link }),
                      }}
                    >
                      {navLink.label}
                    </Box>
                  )}
                </NavLink>
              </Box>
            ))}
          </Box>
        )}
        {!isLeadsViewIndividualVisibility && (
          <Button
            href={stationURL}
            variant="text"
            size="small"
            sx={styles.toDashboardButton}
            endIcon={<ArrowForwardIcon />}
            data-testid={APP_BAR_TEST_IDS.STATION_LINK}
          >
            <Typography
              data-testid={APP_BAR_TEST_IDS.STATION_LINK_LABEL_PREFIX}
              sx={styles.toDashboardButtonLabelPrefix}
            >
              Continue to&nbsp; Dashboard
            </Typography>
          </Button>
        )}
        <Box sx={styles.kpiDashboardGraphic}>
          <KPIDashboardGraphic
            data-testid={APP_BAR_TEST_IDS.KPI_DASHBOARD_GRAPHIC}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default AppBar;
