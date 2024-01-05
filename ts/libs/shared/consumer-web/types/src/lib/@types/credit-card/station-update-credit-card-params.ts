export interface StationUpdateCreditCardParams {
  expiration: string;
  cvv: string;
  billing_city_id: number;
  number: string;
  save_for_future_use: boolean;
  place_of_service: string;
}
