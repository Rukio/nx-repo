import { FC, useState, MouseEvent } from 'react';
import {
  Paper,
  Box,
  Button,
  ChevronRightIcon,
  Link,
  Menu,
  MenuItem,
  makeSxStyles,
  *company-data-covered*Logo,
} from '@*company-data-covered*/design-system';
import { HEADER_TEST_IDS } from './testIds';

interface HeaderProps {
  userName: string;
  logoUrl: string;
  onLogout(): void;
}

const makeStyles = () =>
  makeSxStyles({
    headerRoot: (theme) => ({
      p: theme.spacing(1.5, 3),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.palette.grey[100]}`,
      boxShadow: 'none',
    }),
    homeLink: {
      lineHeight: 0,
      display: 'block',
      mr: 3,
    },
    headerNavigation: {
      display: 'flex',
      alignItems: 'center',
    },
    headerNavigationItem: (theme) => ({
      color: theme.palette.text.primary,
      '& .MuiButton-endIcon': {
        transform: 'rotate(90deg)',
      },
    }),
  });

const Header: FC<HeaderProps> = ({ userName, logoUrl, onLogout }) => {
  const styles = makeStyles();
  const [userMenuElem, setUserMenuElem] = useState<null | HTMLElement>(null);
  const handleClickUserMenu = (event: MouseEvent<HTMLElement>) => {
    setUserMenuElem(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setUserMenuElem(null);
  };

  return (
    <Paper sx={styles.headerRoot} square>
      <Box component="nav" sx={styles.headerNavigation}>
        <Link
          href={logoUrl}
          sx={styles.homeLink}
          data-testid={HEADER_TEST_IDS.LOGO}
        >
          <*company-data-covered*Logo pixelHeight={18} />
        </Link>
      </Box>

      <Button
        onClick={handleClickUserMenu}
        disableElevation
        variant="text"
        endIcon={<ChevronRightIcon />}
        sx={styles.headerNavigationItem}
        data-testid={HEADER_TEST_IDS.USER_NAME_BUTTON}
      >
        {userName}
      </Button>
      <Menu
        open={!!userMenuElem}
        anchorEl={userMenuElem}
        onClose={handleCloseUserMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        data-testid={HEADER_TEST_IDS.HEADER_MENU}
      >
        <MenuItem
          data-testid={HEADER_TEST_IDS.SIGN_OUT_MENU_ITEM}
          onClick={onLogout}
        >
          Sign Out
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default Header;
