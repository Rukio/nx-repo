const payerFormGroupSelectOptionPrefixText = 'payer-form-select-group-option';

export const PAYER_FORM_TEST_IDS = {
  PAYER_NAME_INPUT: 'payer-form-payer-name-input',
  PAYER_STATUS_INACTIVE_RADIO: 'payer-form-radio-status-inactive-radio',
  PAYER_STATUS_ACTIVE_RADIO: 'payer-form-radio-status-active-radio',
  PAYER_GROUP_SELECT: 'payer-form-payer-group-select',
  PAYER_GROUP_SELECT_OPTION_PREFIX: payerFormGroupSelectOptionPrefixText,
  PAYER_NOTES_INPUT: 'payer-form-payer-notes-input',
  ARCHIVE_BUTTON: 'payer-form-archive-button',
  getPayerGroupSelectOptionTestId: (payerGroupId: string | number) =>
    `${payerFormGroupSelectOptionPrefixText}-${payerGroupId}`,
};
