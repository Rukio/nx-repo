import { FC } from 'react';
import {
  Box,
  Typography,
  makeSxStyles,
  ButtonProps,
  LoadingButton,
} from '@*company-data-covered*/design-system';
import { FORM_FOOTER_TEST_IDS } from './testIds';

export type FormFooterProps = {
  submitButtonLabel?: string;
  isSubmitButtonDisabled?: boolean;
  isSubmitButtonLoading?: boolean;
  onSubmit: () => void;
  helperText?: string;
  submitButtonVariant?: ButtonProps['variant'];
};

const makeStyles = () =>
  makeSxStyles({
    helperText: {
      pt: 1,
      color: 'text.secondary',
    },
  });

const FormFooter: FC<FormFooterProps> = ({
  submitButtonLabel = 'Continue',
  isSubmitButtonDisabled = false,
  isSubmitButtonLoading = false,
  onSubmit,
  helperText,
  submitButtonVariant = 'contained',
}) => {
  const styles = makeStyles();

  return (
    <Box data-testid={FORM_FOOTER_TEST_IDS.CONTAINER}>
      <LoadingButton
        disabled={isSubmitButtonDisabled}
        loading={isSubmitButtonLoading}
        variant={submitButtonVariant}
        color="primary"
        size="extraLarge"
        data-testid={FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON}
        onClick={onSubmit}
        fullWidth
      >
        {submitButtonLabel}
      </LoadingButton>
      {helperText && (
        <Typography
          sx={styles.helperText}
          variant="body2"
          data-testid={FORM_FOOTER_TEST_IDS.HELPER_TEXT}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default FormFooter;
