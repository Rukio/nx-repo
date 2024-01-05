const formatListItemValue = (value: string) =>
  value.toLowerCase().replace(/\s/g, '-');

export const ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS = {
  ROOT: 'additional-symptoms-confirmation-root',
  TITLE: 'additional-symptoms-confirmation-title',
  LIST: 'additional-symptoms-confirmation-list',
  getListItem: (value: string) =>
    `additional-symptoms-confirmation-list-item-${formatListItemValue(value)}`,
  CHECKBOX_FORM_CONTROL:
    'additional-symptoms-confirmation-checkbox-form-control',
  CHECKBOX_FIELD: 'additional-symptoms-confirmation-checkbox-field',
};
