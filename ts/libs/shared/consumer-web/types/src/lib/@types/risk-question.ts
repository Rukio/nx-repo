export interface StationRiskQuestion {
  id: string | number;
  name: string;
  order: string | number;
  weight_yes: number;
  weight_no: number;
  required?: boolean;
  protocol_id?: string | number;
  allow_na?: boolean;
  has_notes?: boolean;
  answer?: string;
}

export interface RiskQuestion {
  id: string | number;
  name: string;
  order: string | number;
  weightYes: number;
  weightNo: number;
  required?: boolean;
  protocolId?: string | number;
  allowNa?: boolean;
  hasNotes?: boolean;
  answer?: string;
}
