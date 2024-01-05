export interface UpdateCreditCardParams {
  number: string;
  expiration: string;
  cvv: string;
  placeOfService: string;
  billingCityId: number;
  saveForFutureUse?: boolean;
  patientId: number;
}
