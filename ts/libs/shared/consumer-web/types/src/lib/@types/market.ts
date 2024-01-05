export interface Market {
  allowEtaRangeModification: boolean | null;
  autoAssignTypeOrDefault: string;
  autoAssignable: boolean;
  id: number;
  name: string;
  nextDayEtaEnabled: boolean;
  only911: boolean;
  primaryInsuranceSearchEnabled: boolean;
  selfPayRate: number;
  shortName: string;
  state: string;
  tzName: string;
  tzShortName: string;
  contactEmail?: string;
  enabled?: boolean;
  marketName?: string;
  timezone?: string;
  schedules?: MarketSchedule[];
  stateLocale?: MarketStateLocale;
  telepresentationEligible?: boolean;
  genesysId?: string;
}

export interface StationMarket {
  allow_eta_range_modification: boolean;
  auto_assign_type_or_default: string;
  auto_assignable: boolean;
  id: number;
  name: string;
  next_day_eta_enabled: boolean;
  only_911: boolean;
  primary_insurance_search_enabled: boolean;
  self_pay_rate: number;
  short_name: string;
  state: string;
  tz_name: string;
  tz_short_name: string;
  contact_email?: string;
  enabled?: boolean;
  market_name?: string;
  timezone?: string;
  schedules?: StationMarketSchedule[];
  state_locale?: StationMarketStateLocale;
  genesys_id?: string;
}

export interface MarketSchedule {
  id: number;
  openAt: string;
  closeAt: string;
  openDuration: number;
  days: string[];
  createdAt: string;
  updatedAt: string;
  schedulableType: string;
  schedulableId: number;
}

export interface StationMarketSchedule {
  id: number;
  open_at: string;
  close_at: string;
  open_duration: number;
  days: string[];
  created_at: string;
  updated_at: string;
  schedulable_type: string;
  schedulable_id: number;
}

export enum CallCenterLineType {
  screener = 'screener',
  dispatcher = 'dispatcher',
}

export interface MarketStateLocaleCallCenterLine {
  id: number;
  phoneNumber: string;
  genesysId: string;
  queueName: string;
  callCenterLineType?: CallCenterLineType;
  stateId?: number;
}

export interface MarketStateLocale {
  id: number;
  name: string;
  abbreviation: string;
  screenerLine?: MarketStateLocaleCallCenterLine;
  dispatcherLine?: MarketStateLocaleCallCenterLine;
}

export interface StationMarketStateLocaleCallCenterLine {
  id: number;
  phone_number: string;
  genesys_id: string;
  queue_name: string;
  call_center_line_type?: CallCenterLineType;
  state_id?: number;
}

export interface StationMarketStateLocale {
  id: number;
  name: string;
  abbreviation: string;
  screener_line: StationMarketStateLocaleCallCenterLine;
  dispatcher_line?: StationMarketStateLocaleCallCenterLine;
}
