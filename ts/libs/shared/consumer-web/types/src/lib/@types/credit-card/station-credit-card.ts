export interface StationCreditCard {
  id?: number;
  expiration?: string;
  patient_id?: number;
  save_for_future_use?: boolean;
  last_four?: string;
  card_type?: string;
}
