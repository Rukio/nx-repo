export type AddressObject = {
  id: string;
  streetAddress1: string;
  streetAddress2?: string;
  locationDetails?: string;
  city: string;
  state: string;
  zipCode: string;
};

export type AddressPayload = Omit<AddressObject, 'id'>;
