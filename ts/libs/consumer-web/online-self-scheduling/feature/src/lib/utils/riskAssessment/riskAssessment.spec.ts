import { StructuredSymptom, StructuredSymptomCallTo } from '../statsig';
import {
  getRiskAssessmentOptionsByStructuredSymptom,
  RiskAssessmentScoreThreshold,
} from './riskAssessment';

const mockStructuredSymptom: StructuredSymptom = {
  friendly_name: 'test',
  is_oss_eligible: false,
  legacy_rs_protocol: 'test protocol',
  route_call_to: StructuredSymptomCallTo.Dispatcher,
  legacy_rs_protocol_id: 1,
};

describe('riskAssessment', () => {
  describe('getRiskAssessmentOptionsByStructuredSymptom', () => {
    it.each([
      {
        name: 'empty structured symptom',
        structuredSymptom: null,
        expected: { isRiskAssessmentRequired: false },
      },
      {
        name: 'structured symptom with dispatcher route_call_to',
        structuredSymptom: mockStructuredSymptom,
        expected: { isRiskAssessmentRequired: false },
      },
      {
        name: 'structured symptom with truthy is_oss_eligible',
        structuredSymptom: {
          ...mockStructuredSymptom,
          is_oss_eligible: true,
          route_call_to: StructuredSymptomCallTo.NoCall,
        },
        expected: {
          isRiskAssessmentRequired: true,
          riskAssessmentScore: RiskAssessmentScoreThreshold.Low,
        },
      },
      {
        name: 'structured symptom with screener route_call_to',
        structuredSymptom: {
          ...mockStructuredSymptom,
          route_call_to: StructuredSymptomCallTo.Screener,
        },
        expected: {
          isRiskAssessmentRequired: true,
          riskAssessmentScore: RiskAssessmentScoreThreshold.High,
        },
      },
    ])(
      'should return correct result for $name',
      ({ structuredSymptom, expected }) => {
        const result =
          getRiskAssessmentOptionsByStructuredSymptom(structuredSymptom);
        expect(result).toStrictEqual(expected);
      }
    );
  });
});
