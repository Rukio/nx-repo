const statesSelectItemPrefix = 'insurance-classification-states-select-item';

export const INSURANCE_CLASSIFICATION_TEST_IDS = {
  INSURANCE_PROVIDERS_SEARCH_FIELD:
    'insurance-classification-insurance-providers-search-field',
  STATES_SELECT: 'insurance-classification-states-select',
  STATES_SELECT_ITEM_PREFIX: statesSelectItemPrefix,
  INSURANCE_TYPE_QUESTION: 'insurance-classification-insurance-type-question',
  INSURANCE_THROUGH_COMPANY_QUESTION:
    'insurance-classification-insurance-through-company-question',
  INSURANCE_COMPANY_DETAILS_QUESTION:
    'insurance-classification-insurance-company-details-question',
  INSURANCE_STATE_QUESTION: 'insurance-classification-insurance-state-question',
  getInsuranceTypeRadioOption: (value: string) =>
    `insurance-classification-insurance-type-${value}`,
  getIsPublicInsuranceThroughCompanyRadioOption: (value: string) =>
    `insurance-classification-insurance-through-company-${value}`,
};
