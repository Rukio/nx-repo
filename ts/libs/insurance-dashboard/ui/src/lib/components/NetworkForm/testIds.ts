export const networkFormStateAddressSelectOptionPrefixText =
  'network-form-state-address-select-option';
export const networkFormClassificationSelectOptionPrefixText =
  'network-form-classification-select-option';

export const NETWORK_FORM_TEST_IDS = {
  NAME_INPUT: 'network-form-name-input',
  PACKAGE_ID_INPUT: 'network-form-package-input',
  EMC_CODE_INPUT: 'network-form-emc-code-input',
  CLASSIFICATION_SELECT: 'network-form-classification-select',
  NOTES_INPUT: 'network-form-notes-input',
  ARCHIVE_BUTTON: 'network-form-archive-button',
  ADD_ANOTHER_ADDRESS_BUTTON: 'network-form-add-another-address-button',
  getStateAddressSelectOptionTestId: (stateId: string, addressIndex: number) =>
    `${networkFormStateAddressSelectOptionPrefixText}-${stateId}-${addressIndex}`,
  getClassificationSelectOptionTestId: (classificationId: number) =>
    `${networkFormClassificationSelectOptionPrefixText}-${classificationId}`,
  getActiveQuestionTestId: (name: string) =>
    `network-form-active-question-${name}`,
  getInactiveQuestionTestId: (name: string) =>
    `network-form-inactive-question-${name}`,
  getAddressFormTestId: (addressIndex: number) =>
    `network-form-address-form-${addressIndex}`,
  getAddressFormTitleTestId: (addressIndex: number) =>
    `network-form-address-form-title-${addressIndex}`,
  getStreetAddressInputTestId: (addressIndex: number) =>
    `network-form-street-address-input-${addressIndex}`,
  getCityAddressInputTestId: (addressIndex: number) =>
    `network-form-city-address-input-${addressIndex}`,
  getZipAddressInputTestId: (addressIndex: number) =>
    `network-form-zip-address-input-${addressIndex}`,
  getStateAddressSelectTestId: (addressIndex: number) =>
    `network-form-state-address-select-${addressIndex}`,
  getRemoveAddressButtonTestId: (addressIndex: number) =>
    `network-form-remove-address-button-${addressIndex}`,
};
