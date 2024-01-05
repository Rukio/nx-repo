export const ADDRESS_TEST_IDS = {
  getAddressContainerTestId: (addressId: string) =>
    `${addressId}-address-container`,
  getAddressStreetLineTestId: (addressId: string) =>
    `${addressId}-address-street-1-line`,
  getAddressStreetAddress2LineTestId: (addressId: string) =>
    `${addressId}-address-street-address-2-line`,
  getAddressCityStateZipLineTestId: (addressId: string) =>
    `${addressId}-address-city-state-zip-line`,
};
