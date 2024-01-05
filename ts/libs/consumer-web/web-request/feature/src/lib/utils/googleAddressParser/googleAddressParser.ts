interface AddressComponent {
  long_name: string;
  short_name: string;
  types: Array<string>;
}

export interface GoogleAddress {
  label?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  township?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  addressLine2?: string;
  lat?: number;
  lng?: number;
}

function isStreetNumber(component: AddressComponent): boolean {
  return component.types.includes('street_number');
}

function isStreetName(component: AddressComponent): boolean {
  return component.types.includes('route');
}

function isCity(component: AddressComponent): boolean {
  return component.types.includes('locality');
}

function isState(component: AddressComponent): boolean {
  return component.types.includes('administrative_area_level_1');
}

function isCountry(component: AddressComponent): boolean {
  return component.types.includes('country');
}

function isPostalCode(component: AddressComponent): boolean {
  return component.types.includes('postal_code');
}

function isAddressLine2(component: AddressComponent): boolean {
  return component.types.includes('administrative_area_level_2');
}

function isTownship(component: AddressComponent): boolean {
  return component.types.includes('administrative_area_level_3');
}

export const parseAddress = (
  googleAddress: Partial<google.maps.GeocoderResult>
): GoogleAddress => {
  if (!Array.isArray(googleAddress.address_components)) {
    throw Error('Address Components is not an array');
  }

  if (!googleAddress.address_components.length) {
    throw Error('Address Components is empty');
  }

  const address: GoogleAddress = {};

  for (const component of googleAddress.address_components) {
    if (isStreetNumber(component)) {
      address.streetNumber = component.long_name;
    }

    if (isStreetName(component)) {
      address.streetName = component.long_name;
    }

    if (isCity(component)) {
      address.city = component.long_name;
    }

    if (isCountry(component)) {
      address.country = component.long_name;
    }

    if (isState(component)) {
      address.state = component.short_name;
    }

    if (isPostalCode(component)) {
      address.postalCode = component.long_name;
    }

    if (isAddressLine2(component)) {
      address.addressLine2 = component.long_name;
    }

    if (isTownship(component)) {
      address.township = component.long_name;
    }
  }

  return address;
};
