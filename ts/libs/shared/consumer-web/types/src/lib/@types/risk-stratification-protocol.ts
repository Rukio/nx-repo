import { RiskQuestion, StationRiskQuestion } from './risk-question';

export interface StationProtocol {
  id: string | number;
  weight: string | number;
  name: string;
  high_risk: boolean;
  general: boolean;
  dob?: Date | string;
  gender?: string;
  tags?: string;
}

export interface Protocol {
  id: string | number;
  weight: string | number;
  name: string;
  highRisk?: boolean;
  general?: boolean;
  dob?: Date | string;
  gender?: string;
  tags?: string;
}

export interface ProtocolWithQuestions extends Protocol {
  questions: RiskQuestion[];
}

export interface StationProtocolWithQuestions extends StationProtocol {
  questions: StationRiskQuestion[];
}

export interface StationRiskStratificationProtocol {
  protocols: StationProtocol[];
  key?: string;
}

export interface RiskStratificationProtocol {
  protocols: Protocol[];
  key?: string;
}
