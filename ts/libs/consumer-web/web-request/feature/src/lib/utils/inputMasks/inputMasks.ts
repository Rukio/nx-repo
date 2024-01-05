export const transformValueFromPhone = (val?: string) =>
  !val ? '' : `${val.replace(/\D/g, '')}`.slice(0, 10);

export const phoneNumberWithoutCountry = (val?: string) =>
  val ? val.replace('+1', '') : '';
