import { FC } from 'react';
import {
  Box,
  Link,
  *company-data-covered*Logo,
  makeSxStyles,
  ArrowBackIcon,
} from '@*company-data-covered*/design-system';
import { APP_HEADER_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    appHeader: (theme) => ({
      p: 2,
      position: 'relative',
      zIndex: 1,
      backgroundColor: theme.palette.background.paper,
      boxShadow: `0px 4px 4px -1px rgba(18, 18, 18, 0.02)`,
      lineHeight: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
    expressLink: (theme) => ({
      color: theme.palette.text.secondary,
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      fontSize: theme.typography.fontSize,
      '& svg': {
        color: theme.palette.text.primary,
      },
    }),
  });

export type AppHeaderProps = {
  homeLink: string;
  expressLink?: string;
};

const AppHeader: FC<AppHeaderProps> = ({ homeLink, expressLink }) => {
  const styles = makeStyles();

  return (
    <Box sx={styles.appHeader} data-testid={APP_HEADER_TEST_IDS.APP_HEADER}>
      <Link href={homeLink} data-testid={APP_HEADER_TEST_IDS.HOME_LINK}>
        <*company-data-covered*Logo pixelHeight={16} />
      </Link>
      {!!expressLink && (
        <Link
          sx={styles.expressLink}
          href={expressLink}
          data-testid={APP_HEADER_TEST_IDS.EXPRESS_LINK}
        >
          <ArrowBackIcon />
          Back to Express
        </Link>
      )}
    </Box>
  );
};

export default AppHeader;
