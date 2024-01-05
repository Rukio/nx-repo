export const MY_SETTINGS_LIST_TEST_IDS = {
  getNameListItemTestIdPrefix: (testIdPrefix: string) => `${testIdPrefix}-name`,
  getEmailListItemTestIdPrefix: (testIdPrefix: string) =>
    `${testIdPrefix}-email`,
  getPhoneNumberListItemTestIdPrefix: (testIdPrefix: string) =>
    `${testIdPrefix}-phone-number`,
  getDOBListItemTestIdPrefix: (testIdPrefix: string) => `${testIdPrefix}-dob`,
  getAssignedSexAtBirthListItemTestIdPrefix: (testIdPrefix: string) =>
    `${testIdPrefix}-assigned-sex-at-birth`,
  getGenderIdentityListItemTestIdPrefix: (testIdPrefix: string) =>
    `${testIdPrefix}-gender-identity`,
  getBillingAddressListItemTestIdPrefix: (testIdPrefix: string) =>
    `${testIdPrefix}-billing-address`,
};
