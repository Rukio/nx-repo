import { FC } from 'react';
import {
  Box,
  Typography,
  Button,
  makeSxStyles,
  KeyboardBackspaceIcon,
  Paper,
} from '@*company-data-covered*/design-system';
import { DETAILS_PAGE_HEADER_TEST_IDS } from './testIds';

type DetailsPageHeaderProps = {
  title: string;
  onGoBack: () => void;
};

const makeStyles = () =>
  makeSxStyles({
    headerRoot: (theme) => ({
      p: theme.spacing(1, 4),
      pt: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'start',
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
    headerTitle: (theme) => ({
      fontWeight: theme.typography.fontWeightBold,
    }),
  });

const DetailsPageHeader: FC<DetailsPageHeaderProps> = ({ title, onGoBack }) => {
  const styles = makeStyles();

  return (
    <Paper sx={styles.headerRoot} square>
      <Box>
        <Button
          sx={styles.backButton}
          onClick={onGoBack}
          variant="text"
          data-testid={DETAILS_PAGE_HEADER_TEST_IDS.BACK_BUTTON}
        >
          <KeyboardBackspaceIcon />
          <Typography variant="body2" sx={styles.backButtonTitle}>
            Back
          </Typography>
        </Button>
      </Box>
      <Typography
        variant="h5"
        sx={styles.headerTitle}
        data-testid={DETAILS_PAGE_HEADER_TEST_IDS.TITLE}
      >
        {title}
      </Typography>
    </Paper>
  );
};

export default DetailsPageHeader;
