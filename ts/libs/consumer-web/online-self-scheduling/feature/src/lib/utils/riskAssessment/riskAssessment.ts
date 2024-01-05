import { StructuredSymptom, StructuredSymptomCallTo } from '../statsig';

export enum RiskAssessmentScoreThreshold {
  Low = 1,
  High = 10,
}

type RiskAssessmentOptions = {
  isRiskAssessmentRequired: boolean;
  riskAssessmentScore?: number;
};

export const getRiskAssessmentOptionsByStructuredSymptom = (
  structuredSymptom: StructuredSymptom | null
): RiskAssessmentOptions => {
  if (
    !structuredSymptom ||
    structuredSymptom.route_call_to === StructuredSymptomCallTo.Dispatcher
  ) {
    return { isRiskAssessmentRequired: false };
  }

  if (
    structuredSymptom.is_oss_eligible &&
    structuredSymptom.route_call_to === StructuredSymptomCallTo.NoCall
  ) {
    return {
      isRiskAssessmentRequired: true,
      riskAssessmentScore: RiskAssessmentScoreThreshold.Low,
    };
  }

  return {
    isRiskAssessmentRequired: true,
    riskAssessmentScore: RiskAssessmentScoreThreshold.High,
  };
};
