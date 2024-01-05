import statsig from 'statsig-js';

export const RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME =
  'risk_strat_mapping_for_oss';

export const ONBOARDING_ACUITY_SEGMENTATION_MARKETS_CONFIG_NAME =
  'onboarding_acuity_segmentation_markets';

export const CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME =
  'channel_item_to_medium_mapping';

export enum StructuredSymptomCallTo {
  Dispatcher = 'Dispatcher',
  Screener = 'Screener',
  NoCall = 'No Call',
}

export type StructuredSymptom = {
  friendly_name: string;
  is_oss_eligible: boolean;
  legacy_rs_protocol: string;
  route_call_to: StructuredSymptomCallTo;
  legacy_rs_protocol_id: number;
};

export type AcuitySegmentationMarketClassifications = {
  markets: string[];
  classifications: number[];
};

export interface ChannelItem {
  medium?: string;
  channel_item_name: string;
  channel_item_id: number;
}

export const getStructuredSymptoms = () => {
  return statsig
    .getConfig(RISK_STRAT_MAPPING_FOR_OSS_CONFIG_NAME)
    .get<StructuredSymptom[]>('structured_symptoms', []);
};

export const getStructuredSymptomBySelectedSymptoms = (
  selectedSymptoms?: string
): StructuredSymptom | null => {
  if (!selectedSymptoms) {
    return null;
  }
  const structuredSymptoms = getStructuredSymptoms();

  return (
    structuredSymptoms.find(
      (structuredSymptom) =>
        structuredSymptom.friendly_name === selectedSymptoms
    ) ?? null
  );
};

export const getAcuitySegmentationMarketClassifications = () => {
  return statsig
    .getConfig(ONBOARDING_ACUITY_SEGMENTATION_MARKETS_CONFIG_NAME)
    .get<AcuitySegmentationMarketClassifications>(
      'acuity_segmentation_launched_markets',
      {
        markets: [],
        classifications: [],
      }
    );
};

export const getChannelItems = () => {
  return statsig
    .getConfig(CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME)
    .get<ChannelItem[]>('channel_items', []);
};

export const getDefaultChannelItem = () => {
  return statsig
    .getConfig(CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME)
    .get<ChannelItem | null>('default_channel_item', null);
};
