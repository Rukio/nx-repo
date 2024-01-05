import { FC } from 'react';
import {
  Paper,
  Box,
  Button,
  makeSxStyles,
  KeyboardBackspaceIcon,
  Typography,
} from '@*company-data-covered*/design-system';
import { NETWORK_HEADER_TEST_IDS } from './testIds';

interface NetworkHeaderProps {
  title: string;
  buttonTitle: string;
  onClick(): void;
}

const makeStyles = () =>
  makeSxStyles({
    headerRoot: (theme) => ({
      p: theme.spacing(1, 4),
      pt: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'start',
      borderBottom: `1px solid ${theme.palette.grey[100]}`,
      boxShadow: 'none',
    }),
    backButton: (theme) => ({
      display: 'flex',
      gap: 1,
      padding: 0,
      mb: 1,
      color: theme.palette.action.active,
    }),
    backButtonTitle: (theme) => ({
      color: theme.palette.text.secondary,
    }),
    title: (theme) => ({
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightBold,
    }),
  });

const NetworkHeader: FC<NetworkHeaderProps> = ({
  title,
  buttonTitle,
  onClick,
}) => {
  const styles = makeStyles();

  return (
    <Paper sx={styles.headerRoot} square>
      <Box>
        <Button
          variant="text"
          onClick={onClick}
          sx={styles.backButton}
          data-testid={NETWORK_HEADER_TEST_IDS.BACK_BUTTON}
        >
          <KeyboardBackspaceIcon />
          <Typography variant="body2" sx={styles.backButtonTitle}>
            {buttonTitle}
          </Typography>
        </Button>
      </Box>
      <Typography
        variant="h5"
        sx={styles.title}
        data-testid={NETWORK_HEADER_TEST_IDS.HEADER_TITLE}
      >
        {title}
      </Typography>
    </Paper>
  );
};

export default NetworkHeader;
