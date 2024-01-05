import { FC } from 'react';
import {
  Button,
  Grid,
  Typography,
  AddIcon,
} from '@*company-data-covered*/design-system';
import { PAYERS_HEADER_TEST_IDS } from './testIds';

export interface PayersHeaderProps {
  title: string;
  buttonText: string;
  onAddInsurancePayer(): void;
  disabled?: boolean;
}

const PayersHeader: FC<PayersHeaderProps> = ({
  title,
  buttonText,
  onAddInsurancePayer,
  disabled = false,
}) => {
  return (
    <Grid container justifyContent="space-between">
      <Typography data-testid={PAYERS_HEADER_TEST_IDS.TITLE} variant="h5">
        {title}
      </Typography>
      <Button
        data-testid={PAYERS_HEADER_TEST_IDS.ADD_PAYER_BUTTON}
        variant="contained"
        onClick={onAddInsurancePayer}
        startIcon={<AddIcon />}
        disabled={disabled}
      >
        <Typography>{buttonText}</Typography>
      </Button>
    </Grid>
  );
};

export default PayersHeader;
