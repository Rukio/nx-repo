export interface StationRiskStratificationProtocolSearchParam {
  dob: string;
  gender: string;
  keywords?: string;
  service_line_id?: string | number;
  market_id?: string | number;
  high_risk?: boolean;
}

export interface RiskStratificationProtocolSearchParam {
  dob: string;
  gender: string;
  keywords?: string;
  serviceLineId?: string | number;
  marketId?: string | number;
  highRisk?: boolean;
}
