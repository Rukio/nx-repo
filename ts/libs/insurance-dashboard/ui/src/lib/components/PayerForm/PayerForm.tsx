import { FC, ChangeEventHandler } from 'react';
import {
  TextField,
  Typography,
  Select,
  RadioGroup,
  Radio,
  Button,
  Paper,
  makeSxStyles,
  FormControl,
  FormControlLabel,
  MenuItem,
  SelectChangeEvent,
  Box,
} from '@*company-data-covered*/design-system';
import { PAYER_FORM_TEST_IDS } from './testIds';

type PayerGroup = {
  name: string;
  payerGroupId: string;
};

export type PayerFormProps = {
  payerName: string;
  active: boolean;
  payerNotes: string;
  payerGroup?: string;
  payerGroups: PayerGroup[];
  isEditingForm?: boolean;
  onChangeField: (fieldName: string, value: string | number | boolean) => void;
  onArchive?: () => void;
  disabled?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    formRoot: {
      maxWidth: '800px',
      width: '100%',
      p: 3,
    },
    inputContainer: {
      mt: 3,
    },
    formControlTitle: {
      mb: 1,
    },
    formControlSubTitle: (theme) => ({
      color: theme.palette.text.secondary,
      mb: 2,
    }),
  });

const PayerForm: FC<PayerFormProps> = ({
  payerName,
  active,
  payerNotes,
  payerGroups,
  onChangeField,
  onArchive,
  payerGroup,
  isEditingForm,
  disabled = false,
}) => {
  const styles = makeStyles();

  const handleChangeStatus: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value, name } = event.target;
    onChangeField(name, JSON.parse(value));
  };
  const handleChangePayerGroup = (event: SelectChangeEvent<string>) => {
    const { value, name } = event.target;
    onChangeField(name, value);
  };
  const handleChangeInput: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => {
    const { name, value } = event.target;
    onChangeField(name, value);
  };

  return (
    <Paper sx={styles.formRoot}>
      <TextField
        placeholder="Payer Name"
        name="name"
        fullWidth
        value={payerName}
        inputProps={{
          'data-testid': PAYER_FORM_TEST_IDS.PAYER_NAME_INPUT,
        }}
        onChange={handleChangeInput}
        disabled={disabled}
      />
      <Box sx={styles.inputContainer}>
        <Typography variant="h6" sx={styles.formControlTitle}>
          Status
        </Typography>
        <Typography variant="body2" sx={styles.formControlSubTitle}>
          Only active payers will be available in Onboarding.
        </Typography>
        <FormControl>
          <RadioGroup
            name="active"
            value={active}
            onChange={handleChangeStatus}
          >
            <FormControlLabel
              control={
                <Radio
                  inputProps={{ 'aria-label': 'Status inactive' }}
                  data-testid={PAYER_FORM_TEST_IDS.PAYER_STATUS_INACTIVE_RADIO}
                  disabled={disabled}
                />
              }
              label="Inactive"
              value="false"
            />
            <FormControlLabel
              control={
                <Radio
                  inputProps={{ 'aria-label': 'Status active' }}
                  data-testid={PAYER_FORM_TEST_IDS.PAYER_STATUS_ACTIVE_RADIO}
                  disabled={disabled}
                />
              }
              label="Active"
              value="true"
            />
          </RadioGroup>
        </FormControl>
      </Box>
      <FormControl fullWidth sx={styles.inputContainer}>
        <Typography variant="h6" sx={styles.formControlTitle}>
          Payer Group
        </Typography>
        <Select
          fullWidth
          data-testid={PAYER_FORM_TEST_IDS.PAYER_GROUP_SELECT}
          onChange={handleChangePayerGroup}
          name="payerGroupId"
          value={payerGroup ?? ''}
          disabled={disabled}
        >
          {payerGroups.map((payerGroupItem) => {
            const selector =
              PAYER_FORM_TEST_IDS.getPayerGroupSelectOptionTestId(
                payerGroupItem.payerGroupId
              );

            return (
              <MenuItem
                key={selector}
                value={payerGroupItem.payerGroupId}
                data-testid={selector}
              >
                {payerGroupItem.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={styles.inputContainer}>
        <Typography variant="h6" sx={styles.formControlTitle}>
          Payer Note
        </Typography>
        <Typography variant="body2" sx={styles.formControlSubTitle}>
          This note will display for Dispatchers when this payer is selected
          during Onboarding.
        </Typography>
        <TextField
          multiline
          placeholder="Enter text"
          fullWidth
          value={payerNotes}
          name="notes"
          rows={5}
          inputProps={{
            'data-testid': PAYER_FORM_TEST_IDS.PAYER_NOTES_INPUT,
          }}
          onChange={handleChangeInput}
          disabled={disabled}
        />
      </FormControl>
      {isEditingForm && (
        <FormControl sx={styles.inputContainer}>
          <Button
            variant="outlined"
            color="error"
            size="large"
            data-testid={PAYER_FORM_TEST_IDS.ARCHIVE_BUTTON}
            onClick={onArchive}
            disabled={disabled}
          >
            Archive this Payer
          </Button>
        </FormControl>
      )}
    </Paper>
  );
};

export default PayerForm;
