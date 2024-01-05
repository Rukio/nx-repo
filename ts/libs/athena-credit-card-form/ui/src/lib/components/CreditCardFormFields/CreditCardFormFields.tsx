import { ChangeEvent, FC, FocusEvent } from 'react';
import { PatternFormat } from 'react-number-format';
import {
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
} from '@*company-data-covered*/design-system';
import { CREDIT_CARD_FORM_FIELDS_TEST_IDS } from './testIds';

export type FormFieldName =
  | 'nameOnCard'
  | 'creditCardNumber'
  | 'creditCardExpiration'
  | 'creditCardCVV'
  | 'billingZipCode'
  | 'billingAddress';

export type FormFieldErrorMessages = Partial<Record<FormFieldName, string>>;

export type CreditCardFormFieldsProps = {
  showSaveCardOnFileCheckbox?: boolean;
  errorMessages?: FormFieldErrorMessages;
  onFieldChange?: (name: string, value: string | boolean) => void;
  onFieldBlur?: (name: string) => void;
};

const CreditCardFormFields: FC<CreditCardFormFieldsProps> = ({
  showSaveCardOnFileCheckbox = false,
  errorMessages = {},
  onFieldChange,
  onFieldBlur,
}) => {
  const onTextFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onFieldChange?.(name, value);
  };

  const onCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    onFieldChange?.(name, checked);
  };

  const onTextFieldBlur = (event: FocusEvent<HTMLInputElement>) => {
    onFieldBlur?.(event.target.name);
  };

  return (
    <Grid
      container
      rowSpacing={2}
      columnSpacing={1}
      p={3}
      data-testid={CREDIT_CARD_FORM_FIELDS_TEST_IDS.CONTAINER}
    >
      <Grid item xs={12}>
        <TextField
          label="Name on Card"
          fullWidth
          name="nameOnCard"
          onChange={onTextFieldChange}
          error={!!errorMessages.nameOnCard}
          helperText={errorMessages.nameOnCard}
          onBlur={onTextFieldBlur}
          data-testid={CREDIT_CARD_FORM_FIELDS_TEST_IDS.NAME_ON_CARD_TEXT_FIELD}
          inputProps={{
            'data-testid': CREDIT_CARD_FORM_FIELDS_TEST_IDS.NAME_ON_CARD_INPUT,
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <PatternFormat
          customInput={TextField}
          format="#### #### #### ####"
          fullWidth
          label="Credit Card #"
          name="creditCardNumber"
          error={!!errorMessages.creditCardNumber}
          helperText={errorMessages.creditCardNumber}
          onChange={onTextFieldChange}
          onBlur={onTextFieldBlur}
          data-testid={
            CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_TEXT_FIELD
          }
          inputProps={{
            'data-testid':
              CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_NUMBER_INPUT,
          }}
        />
      </Grid>
      <Grid item xs={6}>
        <PatternFormat
          customInput={TextField}
          format="##/####"
          fullWidth
          label="Expiration (MM/YYYY)"
          name="creditCardExpiration"
          error={!!errorMessages.creditCardExpiration}
          helperText={errorMessages.creditCardExpiration}
          onChange={onTextFieldChange}
          onBlur={onTextFieldBlur}
          data-testid={
            CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_EXPIRATION_TEXT_FIELD
          }
          inputProps={{
            'data-testid':
              CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_EXPIRATION_INPUT,
          }}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="CVV"
          fullWidth
          name="creditCardCVV"
          error={!!errorMessages.creditCardCVV}
          helperText={errorMessages.creditCardCVV}
          onChange={onTextFieldChange}
          onBlur={onTextFieldBlur}
          data-testid={
            CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_CVV_TEXT_FIELD
          }
          inputProps={{
            'data-testid':
              CREDIT_CARD_FORM_FIELDS_TEST_IDS.CREDIT_CARD_CVV_INPUT,
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Billing Street Address"
          fullWidth
          name="billingAddress"
          error={!!errorMessages.billingAddress}
          helperText={errorMessages.billingAddress}
          onChange={onTextFieldChange}
          onBlur={onTextFieldBlur}
          data-testid={
            CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ADDRESS_TEXT_FIELD
          }
          inputProps={{
            'data-testid':
              CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ADDRESS_INPUT,
          }}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Billing Zip Code"
          fullWidth
          name="billingZipCode"
          error={!!errorMessages.billingZipCode}
          helperText={errorMessages.billingZipCode}
          onChange={onTextFieldChange}
          onBlur={onTextFieldBlur}
          data-testid={
            CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ZIP_CODE_TEXT_FIELD
          }
          inputProps={{
            'data-testid':
              CREDIT_CARD_FORM_FIELDS_TEST_IDS.BILLING_ZIP_CODE_INPUT,
          }}
        />
      </Grid>
      {showSaveCardOnFileCheckbox && (
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox name="saveCardOnFile" onChange={onCheckboxChange} />
            }
            label="Save this card on file?"
            data-testid={
              CREDIT_CARD_FORM_FIELDS_TEST_IDS.SAVE_CARD_ON_FILE_FORM_CONTROL
            }
          />
        </Grid>
      )}
    </Grid>
  );
};

export default CreditCardFormFields;
