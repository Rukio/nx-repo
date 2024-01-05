import {
  PartnerLine,
  StationPartnerLine,
} from '@*company-data-covered*/consumer-web-types';
import PartnerLinesQueryDto from '../../dto/partner-lines-query.dto';

export const STATION_PARTNER_LINE_MOCK: StationPartnerLine[] = [
  {
    id: 1,
    channel_item_id: 6235,
    digits: '(720)689-9684',
    created_at: '2021-02-05T17:30:52.236Z',
    updated_at: '2021-02-05T17:30:52.236Z',
    channel_item: {
      name: 'TEST TEST TEST',
    },
  },
];

export const PARTNER_LINE_MOCK: PartnerLine = {
  id: 1,
  channelItemId: 6235,
  digits: '(720)689-9684',
  createdAt: '2021-02-05T17:30:52.236Z',
  updatedAt: '2021-02-05T17:30:52.236Z',
  channelItem: {
    name: 'TEST TEST TEST',
  },
};

export const PARTNER_LINES_QUERY_MOCK: PartnerLinesQueryDto = {
  phoneNumber: 'tel:+17206899684',
};
