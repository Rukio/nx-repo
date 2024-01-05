const addressRadioOptionPrefix = 'address-form-address-radio-option';

export const ADDRESS_FORM_TEST_IDS = {
  ROOT: 'address-form-root',
  ADDRESS_AVAILABILITY_ALERT: 'address-form-address-availability-alert',
  ADDRESS_RADIO_OPTION_PREFIX: addressRadioOptionPrefix,
  RADIO_ROOT: 'address-form-radio-root',
  LOCATION_FIELDS_SECTION: 'address-form-location-fields-section',
  INVALID_ADDRESS_ALERT: 'address-form-location-invalid-address-alert',
  ZIP_CODE_FIELD: 'address-form-zip-code-field',
  ZIP_CODE_INPUT: 'address-form-zip-code-input',
  STREET_ADDRESS_PRIMARY_FIELD: 'address-form-street-address-primary-field',
  STREET_ADDRESS_PRIMARY_INPUT: 'address-form-street-address-primary-input',
  STREET_ADDRESS_SECONDARY_FIELD: 'address-form-street-address-secondary-field',
  STREET_ADDRESS_SECONDARY_INPUT: 'address-form-street-address-secondary-input',
  CITY_FIELD: 'address-form-city-field',
  CITY_INPUT: 'address-form-city-input',
  STATE_FIELD: 'address-form-state-field',
  STATE_SELECT: 'address-form-state-select',
  STATE_SELECT_ITEM_PREFIX: 'address-form-state-select-item',
  LOCATION_TYPE_FIELD: 'address-form-location-type-field',
  LOCATION_TYPE_SELECT: 'address-form-location-type-select',
  LOCATION_TYPE_SELECT_ITEM_PREFIX: 'address-form-location-type-select-item',
  LOCATION_DETAILS_FIELD: 'address-form-location-details-field',
  LOCATION_DETAILS_INPUT: 'address-form-location-details-input',
  getAddressRadioOption: (value: string) =>
    `${addressRadioOptionPrefix}-${value}`,
};
