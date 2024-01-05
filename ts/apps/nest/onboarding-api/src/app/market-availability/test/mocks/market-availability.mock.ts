import {
  StationMarketsAvailabilityZipcode,
  MarketsAvailabilityZipcode,
  StationMarket,
  CheckMarketAvailabilityBody,
  StationCheckMarketAvailabilityBody,
  CheckMarketAvailability,
} from '@*company-data-covered*/consumer-web-types';

export const MOCK_ZIPCODE_FETCH_STATION_RESPONSE: StationMarketsAvailabilityZipcode =
  {
    id: 2034,
    market_id: 165,
    billing_city_id: 10,
  };
export const MOCK_ZIPCODE_FETCH_RESPONSE: MarketsAvailabilityZipcode = {
  id: 2034,
  marketId: 165,
  billingCityId: 10,
};

export const MOCK_ZIPCODE_WITH_MARKET_NAME_FETCH_RESPONSE: MarketsAvailabilityZipcode =
  {
    ...MOCK_ZIPCODE_FETCH_RESPONSE,
    marketShortName: 'DEN',
  };

export const MOCK_MARKET_DETAILS_STATION_RESPONSE: StationMarket = {
  id: 159,
  name: 'Denver',
  state: 'CO',
  short_name: 'DEN',
  only_911: false,
  primary_insurance_search_enabled: true,
  self_pay_rate: 275,
  auto_assignable: false,
  tz_name: 'America/Denver',
  tz_short_name: 'MDT',
  enabled: true,
  market_name: 'Denver',
  timezone: 'America/Denver',
  contact_email: 'ianfo@*company-data-covered*.com',
  allow_eta_range_modification: true,
  auto_assign_type_or_default: 'legacy-auto-assignment',
  next_day_eta_enabled: true,
  schedules: [
    {
      id: 1097,
      open_at: '2000-01-01T07:00:00.000Z',
      close_at: '2000-01-01T23:00:00.000Z',
      open_duration: 57600,
      days: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      created_at: '2021-11-02T19:00:32.403Z',
      updated_at: '2021-11-02T19:00:32.530Z',
      schedulable_type: 'Market',
      schedulable_id: 159,
    },
  ],
  state_locale: {
    id: 6,
    name: 'Colorado',
    abbreviation: 'CO',
    screener_line: {
      id: 6,
      phone_number: '+number',
      genesys_id: 'id',
      queue_name: 'Dispatch Health Nurse Line',
    },
  },
};

export const MOCK_AVAILABLE_RESPONSE: CheckMarketAvailability = {
  availability: 'available',
};

export const MOCK_CHECK_AVAILABILITY_REQUEST_BODY: CheckMarketAvailabilityBody =
  {
    zipcode: '80218',
    marketId: 159,
    date: '2022-08-15',
    latitude: 34.5342242,
    longitude: 23.435532432,
    startTimeSec: 123147841,
    endTimeSec: 13235343,
  };

export const MOCK_CHECK_AVAILABILITY_STATION_REQUEST_BODY: StationCheckMarketAvailabilityBody =
  {
    zipcode: '80218',
    market_id: 159,
    date: '2022-08-15',
    latitude: 34.5342242,
    longitude: 23.435532432,
    start_timestamp_sec: 123147841,
    end_timestamp_sec: 13235343,
  };
