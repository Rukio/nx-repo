import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import { mocked } from 'jest-mock';
import {
  AcuitySegmentationMarketClassifications,
  getAcuitySegmentationMarketClassifications,
  getStructuredSymptomBySelectedSymptoms,
  CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME,
  ChannelItem,
  getChannelItems,
  getDefaultChannelItem,
  getStructuredSymptoms,
  ONBOARDING_ACUITY_SEGMENTATION_MARKETS_CONFIG_NAME,
  RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
  StructuredSymptom,
  StructuredSymptomCallTo,
} from './statsig';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  getConfig: jest.fn(),
}));

const mockGetConfig = mocked(statsig.getConfig);

const mockStructuredSymptom: StructuredSymptom = {
  friendly_name: 'test',
  is_oss_eligible: false,
  legacy_rs_protocol: 'test protocol',
  route_call_to: StructuredSymptomCallTo.Screener,
  legacy_rs_protocol_id: 1,
};

const mockStructuredSymptoms: StructuredSymptom[] = [mockStructuredSymptom];

const mockAcuitySegmentationMarketClassifications: AcuitySegmentationMarketClassifications =
  {
    markets: ['TX'],
    classifications: [1],
  };

const mockedChannelItem: ChannelItem = {
  channel_item_name: 'Digital',
  channel_item_id: 21136,
};

describe('statsig', () => {
  describe('getStructuredSymptoms', () => {
    it('should return correct result', () => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          'risk_strat_mapping_for_oss',
          { structured_symptoms: mockStructuredSymptoms },
          'ruleId',
          {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          }
        )
      );

      const result = getStructuredSymptoms();
      expect(result).toStrictEqual(mockStructuredSymptoms);
    });

    it('should return empty array if config is empty', () => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig('risk_strat_mapping_for_oss', {}, 'ruleId', {
          time: 0,
          reason: EvaluationReason.Bootstrap,
        })
      );

      const result = getStructuredSymptoms();
      expect(result).toStrictEqual([]);
    });
  });

  describe('getAcuitySegmentationMarketClassifications', () => {
    it('should return correct result', () => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          ONBOARDING_ACUITY_SEGMENTATION_MARKETS_CONFIG_NAME,
          {
            acuity_segmentation_launched_markets:
              mockAcuitySegmentationMarketClassifications,
          },
          'ruleId',
          {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          }
        )
      );

      const result = getAcuitySegmentationMarketClassifications();
      expect(result).toStrictEqual(mockAcuitySegmentationMarketClassifications);
    });

    it('should return empty array if config is empty', () => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          ONBOARDING_ACUITY_SEGMENTATION_MARKETS_CONFIG_NAME,
          {},
          'ruleId',
          {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          }
        )
      );

      const result = getAcuitySegmentationMarketClassifications();
      expect(result).toStrictEqual({
        markets: [],
        classifications: [],
      });
    });
  });

  describe('getStructuredSymptomBySelectedSymptoms', () => {
    it('should return correct result', () => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
          { structured_symptoms: [mockStructuredSymptom] },
          'ruleId',
          {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          }
        )
      );

      const result = getStructuredSymptomBySelectedSymptoms(
        mockStructuredSymptom.friendly_name
      );
      expect(result).toStrictEqual(mockStructuredSymptom);
    });

    it('should return null if symptom is not found', () => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
          { structured_symptoms: [mockStructuredSymptom] },
          'ruleId',
          {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          }
        )
      );

      const result = getStructuredSymptomBySelectedSymptoms('none');
      expect(result).toBeNull();
    });

    it('should return empty array if config is empty', () => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME,
          {},
          'ruleId',
          {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          }
        )
      );

      const result = getStructuredSymptomBySelectedSymptoms();
      expect(result).toBeNull();
    });
  });

  describe('getChannelItems', () => {
    it.each([
      { channelItems: [], expectedResult: [] },
      {
        channelItems: [mockedChannelItem],
        expectedResult: [mockedChannelItem],
      },
    ])(
      'returns channel_items correctly',
      ({ channelItems, expectedResult }) => {
        mockGetConfig.mockReturnValue(
          new DynamicConfig(
            CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME,
            { channel_items: channelItems },
            'ruleId',
            {
              time: 0,
              reason: EvaluationReason.Bootstrap,
            }
          )
        );

        const result = getChannelItems();
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe('getDefaultChannelItem', () => {
    it.each([
      { channelItem: null, expectedResult: null },
      { channelItem: mockedChannelItem, expectedResult: mockedChannelItem },
    ])(
      'returns default_channel_item correctly',
      ({ channelItem, expectedResult }) => {
        mockGetConfig.mockReturnValue(
          new DynamicConfig(
            CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME,
            { default_channel_item: channelItem },
            'ruleId',
            {
              time: 0,
              reason: EvaluationReason.Bootstrap,
            }
          )
        );

        const result = getDefaultChannelItem();
        expect(result).toEqual(expectedResult);
      }
    );
  });
});
