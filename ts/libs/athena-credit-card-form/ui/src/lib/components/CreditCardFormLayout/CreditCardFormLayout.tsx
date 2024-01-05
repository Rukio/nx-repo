import { FC, PropsWithChildren, ReactNode } from 'react';
import {
  Alert,
  Box,
  Divider,
  LoadingButton,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';
import { CREDIT_CARD_FORM_LAYOUT_TEST_IDS } from './testIds';

export type CreditCardFormLayoutProps = PropsWithChildren<{
  errorMessage?: ReactNode;
  title: string;
  totalToBeChargedText?: string | null;
  buttonText: string;
  isSubmitButtonDisabled?: boolean;
  isLoading?: boolean;
  onSubmit?: () => void;
}>;

const makeStyles = () =>
  makeSxStyles({
    formContainer: (theme) => ({
      backgroundColor: theme.palette.background.paper,
    }),
    title: {
      p: 3,
    },
    footerWrapper: {
      p: 3,
    },
    errorAlert: {
      mb: 2,
    },
    footerRightWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'end',
    },
    totalToBeChargedWrapper: {
      mb: 2,
      textAlign: 'right',
    },
    totalToBeChargedLabel: (theme) => ({
      fontFamily: 'Open Sans',
      color: theme.palette.text.secondary,
    }),
  });

const CreditCardFormLayout: FC<CreditCardFormLayoutProps> = ({
  children,
  errorMessage,
  title,
  totalToBeChargedText,
  buttonText,
  isSubmitButtonDisabled = false,
  isLoading = false,
  onSubmit,
}) => {
  const styles = makeStyles();

  return (
    <Box
      sx={styles.formContainer}
      data-testid={CREDIT_CARD_FORM_LAYOUT_TEST_IDS.CONTAINER}
    >
      <Typography
        sx={styles.title}
        variant="h6"
        data-testid={CREDIT_CARD_FORM_LAYOUT_TEST_IDS.TITLE}
      >
        {title}
      </Typography>
      <Divider />
      {children}
      <Divider />
      <Box sx={styles.footerWrapper}>
        {errorMessage && (
          <Alert
            sx={styles.errorAlert}
            severity="error"
            message={errorMessage}
            data-testid={CREDIT_CARD_FORM_LAYOUT_TEST_IDS.ERROR_ALERT}
          />
        )}
        <Box sx={styles.footerRightWrapper}>
          {totalToBeChargedText && (
            <Box sx={styles.totalToBeChargedWrapper}>
              <Typography variant="h7" sx={styles.totalToBeChargedLabel}>
                Total to be Charged
              </Typography>
              <Typography
                variant="h5"
                data-testid={
                  CREDIT_CARD_FORM_LAYOUT_TEST_IDS.TOTAL_TO_BE_CHARGED_TEXT
                }
              >
                ${totalToBeChargedText}
              </Typography>
            </Box>
          )}
          <LoadingButton
            variant="contained"
            loading={isLoading}
            disabled={isSubmitButtonDisabled}
            onClick={onSubmit}
            data-testid={CREDIT_CARD_FORM_LAYOUT_TEST_IDS.SUBMIT_BUTTON}
          >
            {buttonText}
          </LoadingButton>
        </Box>
      </Box>
    </Box>
  );
};

export default CreditCardFormLayout;
