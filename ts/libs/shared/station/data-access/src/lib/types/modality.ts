export type Modality = {
  id: number;
  type: string;
  display_name: string;
};

export type ModalityConfig = {
  id: number;
  service_line_id: number;
  market_id: number;
  insurance_plan_id: number;
  modality_id: number;
};

export type MarketModalityConfig = {
  id: number;
  service_line_id: number;
  market_id: number;
  modality_id: number;
};

export type NetworkModalityConfig = {
  id: number;
  network_id: number;
  service_line_id: number;
  billing_city_id: number;
  modality_id: number;
};
