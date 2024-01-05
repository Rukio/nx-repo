export const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

export const HEADER_HEIGHT = '64px';
export const UNASSIGNED_VISITS_WIDTH = '370px';

export const SEARCH_DEBOUNCE_TIME = 300;

export const formSexOptions = [
  {
    id: 'female',
    name: 'Female',
  },
  {
    id: 'male',
    name: 'Male',
  },
  {
    id: 'unspecified',
    name: 'Unspecified',
  },
];

export const usStatesAbbreviations = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'DC',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];

export const defaultDateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

// IdleTimer constant
export const TIMER_TIMEOUT = 30; // minutes
export const TIMER_UNTIL_PROMPT = 15; // minutes
export const TIMER_UNTIL_IDLE = TIMER_TIMEOUT - TIMER_UNTIL_PROMPT; // minutes
