import { PropsWithChildren, FC, ReactNode } from 'react';
import {
  LinearProgress,
  KeyboardBackspaceIcon,
  Box,
  makeSxStyles,
  Button,
  linearProgressClasses,
  alpha,
  Paper,
  CircularProgress,
} from '@*company-data-covered*/design-system';
import { Link as ReactRouterLink } from 'react-router-dom';
import { PAGE_LAYOUT_TEST_IDS } from './testIds';

export type PageLayoutProps = PropsWithChildren<{
  stepProgress?: number;
  backButtonOptions?: {
    text: string;
    link: string;
  };
  message?: ReactNode;
  isLoading?: boolean;
}>;

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }),
    progressBar: (theme) => ({
      height: '12px',
      backgroundColor: alpha(theme.palette.primary.main, 0.3),
      [`& .${linearProgressClasses.bar}`]: {
        borderRadius: theme.spacing(0, 2, 2, 0),
      },
    }),
    bodyWrapper: {
      display: 'flex',
      justifyContent: 'center',
      px: 2,
    },
    formWrapper: {
      maxWidth: '600px',
      width: '100%',
    },
    navigationSection: {
      mt: {
        xs: 3,
        sm: 4,
      },
    },
    contentTopIndent: {
      mt: 2,
    },
    childrenWrapper: (theme) => ({
      p: {
        xs: theme.spacing(3, 2),
        sm: 3,
      },
      borderRadius: '8px',
      border: `1px solid ${theme.palette.grey[200]}`,
    }),
  });

const PageLayout: FC<PageLayoutProps> = ({
  stepProgress,
  backButtonOptions,
  message,
  children,
  isLoading = false,
}) => {
  const styles = makeStyles();
  const isNavigationSectionVisible = !!backButtonOptions || !!message;

  return (
    <Box sx={styles.root}>
      {!!stepProgress && (
        <LinearProgress
          sx={styles.progressBar}
          variant="determinate"
          value={stepProgress}
          data-testid={PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR}
        />
      )}
      <Box sx={styles.bodyWrapper}>
        {isLoading ? (
          <CircularProgress
            size={100}
            sx={styles.contentTopIndent}
            data-testid={PAGE_LAYOUT_TEST_IDS.LOADER}
          />
        ) : (
          <Box sx={styles.formWrapper}>
            {isNavigationSectionVisible && (
              <Box sx={styles.navigationSection}>
                {!!backButtonOptions && (
                  <Button
                    component={ReactRouterLink}
                    to={backButtonOptions.link}
                    data-testid={PAGE_LAYOUT_TEST_IDS.BACK_BUTTON}
                    variant="text"
                    startIcon={<KeyboardBackspaceIcon />}
                  >
                    {backButtonOptions.text}
                  </Button>
                )}
                {!!message && (
                  <Box data-testid={PAGE_LAYOUT_TEST_IDS.MESSAGE_SECTION}>
                    {message}
                  </Box>
                )}
              </Box>
            )}
            <Paper
              elevation={0}
              sx={[styles.childrenWrapper, styles.contentTopIndent]}
            >
              {children}
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageLayout;
