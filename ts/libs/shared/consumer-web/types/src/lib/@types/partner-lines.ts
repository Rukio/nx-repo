export interface StationPartnerLine {
  id: number;
  channel_item_id: number;
  digits: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  channel_item?: {
    name: string;
  };
}

export interface PartnerLine {
  id: number;
  channelItemId: number;
  digits: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  channelItem?: {
    name: string;
  };
}
