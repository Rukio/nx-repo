export const formatPhoneNumber = (phoneNumber = ''): string => {
  const digitsOnlyPhoneNumber = phoneNumber.replace(/\D/g, '');
  const standardPhoneNumberMatch = digitsOnlyPhoneNumber.match(
    /^(\d{3})(\d{3})(\d{4})$/
  );
  const countryCodePhoneNumberMatch = digitsOnlyPhoneNumber.match(
    /^(1)?(\d{3})(\d{3})(\d{4})$/
  );

  if (standardPhoneNumberMatch) {
    return `${standardPhoneNumberMatch[1]}-${standardPhoneNumberMatch[2]}-${standardPhoneNumberMatch[3]}`;
  }
  if (countryCodePhoneNumberMatch) {
    return `${countryCodePhoneNumberMatch[2]}-${countryCodePhoneNumberMatch[3]}-${countryCodePhoneNumberMatch[4]}`;
  }

  return phoneNumber;
};
