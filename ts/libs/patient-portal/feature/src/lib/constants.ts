export type PatientPathParams = 'patientId';
export type AddressPathParams = 'addressId';

export type PathBuilderParams<T extends string | number | symbol> = Record<
  T,
  string | number
>;

const buildPatientDetailsPath = ({
  patientId,
}: PathBuilderParams<PatientPathParams>) =>
  PATIENT_PORTAL_ROUTES.PATIENT_DETAILS.replace(
    ':patientId',
    patientId.toString()
  );

const buildAddressDetailsPath = ({
  addressId,
}: PathBuilderParams<AddressPathParams>) =>
  PATIENT_PORTAL_ROUTES.ADDRESS_DETAILS.replace(
    ':addressId',
    addressId.toString()
  );

export const PATIENT_PORTAL_ROUTES = {
  LANDING_PAGE: '/',
  PATIENT_CREATE: '/patients/create',
  PATIENT_DETAILS: '/patients/:patientId',
  ADDRESS_CREATE: '/addresses/create',
  ADDRESS_DETAILS: '/addresses/:addressId',
  buildPatientDetailsPath,
  buildAddressDetailsPath,
};

export const NAVIGATION_TO_SETTINGS_PARAMS = {
  text: 'Settings',
  link: '/',
};
