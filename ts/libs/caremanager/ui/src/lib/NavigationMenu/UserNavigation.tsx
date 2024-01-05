import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFeatureFlagServiceRequests } from '@*company-data-covered*/caremanager/utils-react';
import {
  Box,
  CloseIcon,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  MenuIcon,
  SettingsIcon,
  Typography,
  makeSxStyles,
  theme,
} from '@*company-data-covered*/design-system';
import { assets } from '../assets';

const styles = makeSxStyles({
  drawerContainer: { width: 280 },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 2,
    lineHeight: 0,
    borderBottom: `1px solid ${theme.palette.grey.A100}`,
  },
  drawerLogo: { width: 161 },
  link: {
    textDecoration: 'none',
    color: theme.palette.text.primary,
  },
  list: { padding: 0 },
  item: {
    borderBottom: `1px solid ${theme.palette.grey.A100}`,
    paddingTop: 2,
    paddingBottom: 2,
  },
});

const settingsLinkProps = {
  to: '/settings/task-templates',
  component: RouterLink,
};

const episodesLinkProps = {
  to: '/episodes',
  component: RouterLink,
};

type Props = {
  isMobile: boolean;
};

const UserNavigation: React.FC<Props> = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const shouldShowServiceRequests = useFeatureFlagServiceRequests();

  return (
    <>
      {isMobile ? (
        <IconButton
          aria-label="delete"
          data-testid="hamburger-menu-button"
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon />
        </IconButton>
      ) : (
        <Link {...settingsLinkProps}>
          <IconButton aria-label="delete" data-testid="settings-button">
            <SettingsIcon />
          </IconButton>
        </Link>
      )}
      <Drawer anchor="right" open={isOpen} onClose={() => setIsOpen(false)}>
        <Box sx={styles.drawerContainer}>
          <Box sx={styles.drawerHeader}>
            <Box sx={styles.drawerLogo} data-testid="dispatch-health-logo">
              <img alt="logo" src={assets.DHLogoInline} />
            </Box>
            <IconButton
              onClick={() => setIsOpen(false)}
              aria-label="delete"
              data-testid="close-drawer-button"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <List sx={styles.list}>
            <ListItem sx={styles.item}>
              <Link
                data-testid="link-to-episodes"
                onClick={() => setIsOpen(false)}
                sx={styles.link}
                {...episodesLinkProps}
              >
                <Typography variant="body1">Episodes</Typography>
              </Link>
            </ListItem>
            {shouldShowServiceRequests && (
              <ListItem sx={styles.item}>
                <Link
                  data-testid="link-to-requests"
                  onClick={() => setIsOpen(false)}
                  sx={styles.link}
                  to="/requests"
                  component={RouterLink}
                >
                  <Typography variant="body1">Request Manager</Typography>
                </Link>
              </ListItem>
            )}
            <ListItem sx={styles.item}>
              <Link
                data-testid="link-to-settings"
                onClick={() => setIsOpen(false)}
                sx={styles.link}
                {...settingsLinkProps}
              >
                <Typography variant="body1">Settings</Typography>
              </Link>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default UserNavigation;
