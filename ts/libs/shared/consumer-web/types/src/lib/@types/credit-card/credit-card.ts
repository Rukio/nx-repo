export interface CreditCard {
  id?: number;
  patientId?: number;
  expiration?: string;
  lastFour?: string;
  cardType?: string;
  careRequestId?: number;
  saveForFutureUse?: boolean;
}
