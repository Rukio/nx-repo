const autcompleteDropdownOptionPrefix =
  'symptom-form-autocomplete-dropdown-option';

export const SYMPTOMS_FORM_TEST_IDS = {
  ROOT: 'symptoms-form-root',
  CUSTOM_SYMPTOM_FIELD: 'symptoms-form-custom-symptom-field',
  CUSTOM_SYMPTOM_INPUT: 'symptoms-form-custom-symptom-input',
  CUSTOM_SYMPTOM_INPUT_BUTTON: 'symptoms-form-custom-symptom-input-button',
  AUTOCOMPLETE_FIELD: 'symptom-form-autocomplete-field',
  AUTCOMPLETE_DROPDOWN_OPTION_PREFIX: autcompleteDropdownOptionPrefix,
  getAutocompleteDropdownOption: (option: string) =>
    `${autcompleteDropdownOptionPrefix}-${option}`,
};
