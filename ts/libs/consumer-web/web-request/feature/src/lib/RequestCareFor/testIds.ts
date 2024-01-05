export const REQUEST_CARE_FOR_TEST_IDS = {
  REQUESTING_CARE_HEADER: 'requesting-care-header',
  CONTINUE_BUTTON: 'continue-button',
  getCareForButtonTestId: (option: string) =>
    `${option.toLowerCase().replace(/\s/g, '-')}-option-button`,
};
