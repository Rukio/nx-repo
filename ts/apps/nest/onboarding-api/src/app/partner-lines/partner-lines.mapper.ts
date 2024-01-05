import {
  PartnerLine,
  StationPartnerLine,
} from '@*company-data-covered*/consumer-web-types';

const StationPartnerLineToPartnerLine = (
  input: StationPartnerLine
): PartnerLine => {
  const output: PartnerLine = {
    id: input.id,
    channelItemId: input.channel_item_id,
    digits: input.digits,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    channelItem: input.channel_item && {
      name: input.channel_item.name,
    },
  };

  return output;
};

const PartnerLineToStationPartnerLine = (
  input: PartnerLine
): StationPartnerLine => {
  const output: StationPartnerLine = {
    id: input.id,
    channel_item_id: input.channelItemId,
    digits: input.digits,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
    channel_item: input.channelItem && {
      name: input.channelItem.name,
    },
  };

  return output;
};

export default {
  StationPartnerLineToPartnerLine,
  PartnerLineToStationPartnerLine,
};
