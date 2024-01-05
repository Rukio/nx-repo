import { FC } from 'react';
import {
  Box,
  Button,
  LoadingButton,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FORM_CONTROLS_TEST_IDS } from './testIds';

export type FormManageControlsProps = {
  onCancel: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    formControlsRoot: (theme) => ({
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: theme.palette.common.white,
      borderTop: `1px solid ${theme.palette.divider}`,
      py: 2,
      px: 4,
    }),
    submitButton: {
      ml: 2,
    },
  });

const FormManageControls: FC<FormManageControlsProps> = ({
  onCancel,
  onSubmit,
  disabled,
  isLoading,
}) => {
  const styles = makeStyles();

  return (
    <Box data-testid={FORM_CONTROLS_TEST_IDS.ROOT} sx={styles.formControlsRoot}>
      <Button
        onClick={onCancel}
        disabled={disabled || isLoading}
        data-testid={FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON}
      >
        Cancel
      </Button>
      <LoadingButton
        onClick={onSubmit}
        disabled={disabled || isLoading}
        loading={isLoading}
        variant="contained"
        sx={styles.submitButton}
        data-testid={FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON}
      >
        Save
      </LoadingButton>
    </Box>
  );
};

export default FormManageControls;
