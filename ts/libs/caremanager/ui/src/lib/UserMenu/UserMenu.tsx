import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import {
  ArrowDropDownIcon,
  Button,
  Menu,
  MenuItem,
  PersonIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  button: {
    color: 'text.secondary',
    padding: 0,
    minWidth: 0,
  },
  personIcon: { color: 'text.secondary' },
});

type MenuButtonProps = {
  name?: string;
  isLoading: boolean;
};

const MenuButton: React.FC<MenuButtonProps> = ({ name, isLoading }) => {
  if (isLoading) {
    return <>Authenticating...</>;
  }

  return (
    <>
      {name}
      <ArrowDropDownIcon />
    </>
  );
};

type UserMenuProps = {
  isMobile: boolean;
};

const UserMenu: React.FC<UserMenuProps> = ({ isMobile }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { logout, user, isLoading } = useAuth0();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        data-testid="user-menu-button"
        size="medium"
        variant="text"
        onClick={handleClick}
        sx={styles.button}
      >
        {isMobile ? (
          <PersonIcon sx={styles.personIcon} />
        ) : (
          <MenuButton name={user?.name} isLoading={isLoading} />
        )}
      </Button>
      <Menu
        data-testid="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() =>
            logout({ logoutParams: { returnTo: window.location.origin } })
          }
        >
          <Typography variant="body2" data-testid="logout-button">
            Log Out
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
