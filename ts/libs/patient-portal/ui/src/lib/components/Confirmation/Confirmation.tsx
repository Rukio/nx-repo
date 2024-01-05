import { FC } from 'react';
import {
  Alert,
  AlertProps,
  Box,
  Button,
  ButtonProps,
} from '@*company-data-covered*/design-system';
import { CONFIRMATION_TEST_IDS } from './testIds';

export type ConfirmationProps = {
  testIdPrefix: string;
  alertMessage: string;
  buttonText: string;
  handleSubmit: () => void;
  severity?: AlertProps['severity'];
  buttonColor?: ButtonProps['color'];
};

const Confirmation: FC<ConfirmationProps> = ({
  testIdPrefix,
  alertMessage,
  buttonText,
  handleSubmit,
  severity = 'error',
  buttonColor = 'error',
}) => (
  <Box
    data-testid={CONFIRMATION_TEST_IDS.getConfirmationContainerTestId(
      testIdPrefix
    )}
  >
    <Alert
      data-testid={CONFIRMATION_TEST_IDS.getConfirmationAlertTestId(
        testIdPrefix
      )}
      variant="outlined"
      severity={severity}
      message={alertMessage}
    />
    <Button
      data-testid={CONFIRMATION_TEST_IDS.getConfirmationButtonTestId(
        testIdPrefix
      )}
      fullWidth
      color={buttonColor}
      variant="contained"
      onClick={handleSubmit}
    >
      {buttonText}
    </Button>
  </Box>
);

export default Confirmation;
