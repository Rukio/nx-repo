export interface InsuranceDeleteRequest {
  insurance: {
    remove_card_front: boolean;
    remove_card_back: boolean;
  };
}
