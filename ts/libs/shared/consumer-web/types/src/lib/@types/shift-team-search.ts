export interface StationShiftTeamSearchParam {
  market_id?: string;
  care_request_id?: string;
  ids?: string | string[];
  market_ids?: string | string[];
  start?: Date | string;
  end?: Date | string;
}

export interface ShiftTeamSearchParam {
  marketId?: string;
  careRequestId?: string;
  ids?: string[];
  marketIds?: string[];
  start?: Date | string;
  end?: Date | string;
}
