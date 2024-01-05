import {
  Box,
  Button,
  LoadingButton,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { MODALITY_CONTROLS_TEST_IDS } from './testIds';

export type ModalityControlsProps = {
  onCancel: () => void;
  onSave: () => void;
  isLoading?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    controlsWrapper: {
      display: 'flex',
      justifyContent: 'flex-end',
      my: 3,
    },
    submitButton: {
      ml: 3,
    },
  });

const ModalityControls = ({
  onCancel,
  onSave,
  isLoading,
}: ModalityControlsProps) => {
  const styles = makeStyles();

  return (
    <Box sx={styles.controlsWrapper}>
      <Button
        data-testid={MODALITY_CONTROLS_TEST_IDS.CANCEL_BUTTON}
        disabled={isLoading}
        onClick={onCancel}
      >
        Cancel
      </Button>
      <LoadingButton
        data-testid={MODALITY_CONTROLS_TEST_IDS.SUBMIT_BUTTON}
        loading={isLoading}
        disabled={isLoading}
        onClick={onSave}
        variant="contained"
        size="large"
        sx={styles.submitButton}
      >
        Save
      </LoadingButton>
    </Box>
  );
};

export default ModalityControls;
