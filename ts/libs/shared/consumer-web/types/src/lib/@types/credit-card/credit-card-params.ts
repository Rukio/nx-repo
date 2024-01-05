export interface CreditCardParams {
  number: string;
  expiration: string;
  cvv: string;
  placeOfService: string;
  billingCityId: number;
  saveForFutureUse: boolean;
  careRequestId?: number;
  patientId?: number;
  id?: number;
}
