export interface StationCreditCardParams {
  number: string;
  expiration: string;
  cvv: string;
  place_of_service: string;
  billing_city_id: number;
  save_for_future_use: boolean;
}
