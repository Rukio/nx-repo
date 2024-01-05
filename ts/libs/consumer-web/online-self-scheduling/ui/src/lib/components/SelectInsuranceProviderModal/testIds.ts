export const SELECT_INSURANCE_PROVIDER_MODAL_TEST_IDS = {
  CONTAINER: 'select-insurance-provider-modal-container',
  CLOSE_MODAL_ICON: 'select-insurance-provider-modal-close-modal-icon',
  SEARCH_INSURANCE: 'select-insurance-provider-modal-search-input',
  INSURANCE_NOT_IN_THE_LIST:
    'select-insurance-provider-modal-insurance-not-in-the-list',
  getSectionCharacter: (value: string) =>
    `select-insurance-provider-modal-section-character-${value}`,
  getInsuranceOptionId: (value: string) =>
    `select-insurance-provider-modal-option-${value}`,
};
