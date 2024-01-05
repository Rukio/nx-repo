import { FC } from 'react';
import {
  Box,
  *company-data-covered*Logo,
  Link,
  makeSxStyles,
  Avatar,
} from '@*company-data-covered*/design-system';
import { APP_BAR_TEST_IDS } from './testIds';

type Props = {
  logoLink?: string;
};

const makeStyles = () =>
  makeSxStyles({
    container: (theme) => ({
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.paper,
      boxShadow: '0px 4px 4px -1px rgba(18, 18, 18, 0.02)',
    }),
    logoWrapper: {
      display: 'flex',
      alignItems: 'center',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
    },
    avatar: (theme) => ({
      width: '24px',
      height: '24px',
      backgroundColor: theme.palette.grey[400],
      '& .MuiAvatar-fallback': {
        fill: theme.palette.common.white,
      },
    }),
  });

const AppBar: FC<Props> = ({ logoLink = '/' }) => {
  const styles = makeStyles();

  return (
    <Box data-testid={APP_BAR_TEST_IDS.APP_BAR_CONTAINER} sx={styles.container}>
      <Box sx={styles.logoWrapper} component="nav">
        <Link
          data-testid={APP_BAR_TEST_IDS.DISPATCH_HEALTH_LOGO_LINK}
          href={logoLink}
          sx={styles.logo}
        >
          <*company-data-covered*Logo />
        </Link>
      </Box>
      <Box>
        <Avatar sx={styles.avatar} variant="circular" />
      </Box>
    </Box>
  );
};

export default AppBar;
