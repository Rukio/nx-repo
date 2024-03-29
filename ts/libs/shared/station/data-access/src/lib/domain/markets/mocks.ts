import { Market, MarketStateLocale } from '../../types';

export const mockedMarket: Required<Market> & {
  state_locale?: Required<MarketStateLocale>;
} = {
  id: 1,
  name: 'Test',
  state: 'CO',
  short_name: 'TT',
  only_911: false,
  primary_insurance_search_enabled: true,
  self_pay_rate: 100,
  auto_assignable: false,
  tz_name: 'America/Phoenix',
  tz_short_name: 'MST',
  zipcode: null,
  old_open_at: null,
  old_close_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  old_open_duration: null,
  sa_time_zone: 'Arizona',
  enabled: true,
  provider_group_name: 'Test',
  latitude: 0,
  longitude: 0,
  humanity_id: '1',
  hie_url_string: '',
  congestion_threshold: null,
  service_area_radius: null,
  too_far_threshold: 1,
  logistics_options: {
    service_area_type: 'test',
    eta_range_window_hours: '2',
    allow_eta_range_modification: true,
    early_forgiveness_threshold: '',
    late_forgiveness_threshold: '',
    enable_next_day_eta: true,
  },
  display_insurance_note: false,
  insurance_note: '',
  followup_percentage: 0,
  enable_breaks: true,
  geocode_provider: null,
  return_time_offset: null,
  onboarding_cc_capture: true,
  npi: '1111',
  chronic_care_notification: true,
  market_image: {
    url: null,
    scaled: {
      url: null,
    },
  },
  service_area_image: {
    url: null,
    scaled: {
      url: null,
    },
  },
  market_name: 'Test',
  timezone: 'America/Phoenix',
  contact_email: 'test@*company-data-covered*.com',
  'capacity_managed?': false,
  allow_eta_range_modification: true,
  auto_assign_type_or_default: 'test',
  next_day_eta_enabled: true,
  schedules: [
    {
      id: 1,
      open_at: new Date().toISOString(),
      close_at: new Date().toISOString(),
      open_duration: 1,
      days: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schedulable_type: 'Market',
      schedulable_id: 1,
    },
  ],
  state_locale: {
    id: 1,
    name: 'Colorado',
    abbreviation: 'CO',
    screener_line: {
      id: 1,
      genesys_id: '14825fbd-ca54-4675-972b-15a087e86ced',
      phone_number: '+11111111111',
      queue_name: 'Testing',
    },
  },
  genesys_id: '14825fbd-ca54-4675-972b-15a087e86ced',
};
