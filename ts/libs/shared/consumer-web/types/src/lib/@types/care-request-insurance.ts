export interface StationCareRequestInsurance {
  member_id?: string | number;
  insurance_provider?: string;
  insurance_plan?: string;
  self_pay?: boolean;
  card_front?: string;
  card_back?: string;
  care_request_id: string | number;
  'g-recaptcha-response-data': {
    request_care: string;
  };
}

export interface CareRequestInsuranceParams {
  memberId?: string | number;
  insuranceProvider?: string;
  insurancePlan?: string;
  selfPay?: boolean;
  cardFront?: string;
  cardBack?: string;
  careRequestId: string | number;
  token: string;
}
