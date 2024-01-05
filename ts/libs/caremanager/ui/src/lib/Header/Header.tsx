import {
  useFeatureFlagServiceRequests,
  useFeatureFlagVirtualApp,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  AppBar,
  Box,
  Container,
  Link,
  Toolbar,
  makeSxStyles,
  useMediaQuery,
  useTheme,
} from '@*company-data-covered*/design-system';
import { Link as RouterLink } from 'react-router-dom';
import TitleButton from './TitleButton';
import UserMenu from '../UserMenu';
import NavigationMenu from '../NavigationMenu';
import { assets } from '../assets';

const styles = makeSxStyles({
  container: {
    backgroundColor: (theme) => theme.palette.background.paper,
    borderBottom: (theme) => `1px solid ${theme.palette.grey.A100}`,
  },
  logoWrapper: { lineHeight: 0, width: { xs: 161 } },
  link: { textDecoration: 'none' },
  title: { paddingLeft: 3, flexGrow: 1 },
});

export const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const shouldShowServiceRequests = useFeatureFlagServiceRequests();
  const shouldShowVirtualApp = useFeatureFlagVirtualApp();

  return (
    <AppBar
      data-testid="app-header"
      position="fixed"
      elevation={0}
      sx={styles.container}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters>
          <Box sx={styles.logoWrapper} data-testid="dispatch-health-logo">
            <Link
              sx={styles.link}
              {...{ to: '/episodes', component: RouterLink }}
            >
              <img alt="logo" src={assets.DHLogoInline} />
            </Link>
          </Box>
          <Box sx={styles.title}>
            {!isMobile && (
              <>
                <TitleButton
                  title="Episodes"
                  href="/"
                  testIdPrefix="episodes"
                />
                {shouldShowServiceRequests && (
                  <TitleButton
                    title="Request Manager"
                    href="/requests"
                    testIdPrefix="requests"
                  />
                )}
                {shouldShowVirtualApp && (
                  <TitleButton
                    title="Virtual APP"
                    href="/virtual-app"
                    testIdPrefix="virtual-app"
                  />
                )}
              </>
            )}
          </Box>
          <UserMenu isMobile={isMobile} />
          <NavigationMenu isMobile={isMobile} />
        </Toolbar>
      </Container>
    </AppBar>
  );
};
