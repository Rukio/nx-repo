import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import {
  getMarketNameFromHowItWorksConfig,
  getSymptomsFromStructuredSymptomsConfig,
} from './statsig';

console.log = jest.fn();

describe('Statsig', () => {
  describe('getSymptomsFromStructuredSymptomsConfig', () => {
    it('should return empty array when no value retrieved from config', () => {
      jest.spyOn(statsig, 'getConfig').mockImplementation(
        () =>
          new DynamicConfig('web_request_structured_symptoms', {}, 'ruleId', {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          })
      );
      const result = getSymptomsFromStructuredSymptomsConfig();
      expect(result).toStrictEqual([]);
    });

    it('should return empty array when no value retrieved from config', () => {
      const structuredSymptomsMock = ['symptom'];
      jest.spyOn(statsig, 'getConfig').mockImplementation(
        () =>
          new DynamicConfig(
            'web_request_structured_symptoms',
            { structured_symptoms: structuredSymptomsMock },
            'ruleId',
            {
              time: 0,
              reason: EvaluationReason.Bootstrap,
            }
          )
      );
      const result = getSymptomsFromStructuredSymptomsConfig();
      expect(result).toStrictEqual(structuredSymptomsMock);
    });

    it('should return empty array when error occurred', () => {
      jest.spyOn(statsig, 'getConfig').mockImplementation(() => {
        throw Error();
      });
      const result = getSymptomsFromStructuredSymptomsConfig();
      expect(result).toStrictEqual([]);
    });
  });

  describe('getMarketNameFromHowItWorksConfig', () => {
    it('should return null when no value retrieved from config', () => {
      jest.spyOn(statsig, 'getConfig').mockImplementation(
        () =>
          new DynamicConfig('web_request_how_it_works_markets', {}, 'ruleId', {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          })
      );
      const result = getMarketNameFromHowItWorksConfig('TES');
      expect(result).toStrictEqual(null);
    });

    it('should return null when error occurred', () => {
      jest.spyOn(statsig, 'getConfig').mockImplementation(() => {
        throw Error();
      });
      const result = getMarketNameFromHowItWorksConfig('TES');
      expect(result).toStrictEqual(null);
    });

    it('should return null when value is not found', () => {
      const mockMarkets: {
        abbreviation: string;
        name: string;
      }[] = [{ abbreviation: 'COS', name: 'Colorado Springs' }];
      jest.spyOn(statsig, 'getConfig').mockImplementation(
        () =>
          new DynamicConfig(
            'web_request_how_it_works_markets',
            { how_it_works_markets: mockMarkets },
            'ruleId',
            {
              time: 0,
              reason: EvaluationReason.Bootstrap,
            }
          )
      );
      const result = getMarketNameFromHowItWorksConfig('TES');
      expect(result).toStrictEqual(null);
    });

    it('should return found market', () => {
      const mockMarkets: {
        abbreviation: string;
        name: string;
      }[] = [{ abbreviation: 'COS', name: 'Colorado Springs' }];
      const mockMarket = mockMarkets[0];

      jest.spyOn(statsig, 'getConfig').mockImplementation(
        () =>
          new DynamicConfig(
            'web_request_how_it_works_markets',
            { how_it_works_markets: mockMarkets },
            'ruleId',
            {
              time: 0,
              reason: EvaluationReason.Bootstrap,
            }
          )
      );
      const result = getMarketNameFromHowItWorksConfig(mockMarket.abbreviation);
      expect(result).toStrictEqual(mockMarket.name);
    });
  });
});
