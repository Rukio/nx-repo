import { Alert } from '@*company-data-covered*/design-system';
import { DEFAULT_ERROR_ALERT_TEXT } from '../../constants';

interface DefaultAlertProps {
  dataTestId?: string;
}

const DefaultAlert = ({ dataTestId }: DefaultAlertProps) => (
  <Alert
    severity="error"
    message={DEFAULT_ERROR_ALERT_TEXT}
    data-testid={dataTestId}
  />
);

export default DefaultAlert;
