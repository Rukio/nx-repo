import { PROVIDER_SHIFTS_TABLE_TEST_IDS } from './testIds';

export const PROVIDER_SHIFTS_TABLE_ALERT =
  'Unable to retrieve breakdown for this shift.';

export enum FromTimestampDays {
  SEVEN = 7,
  THIRTY = 30,
}

// TODO(PE-2377): consolidate SortOrder enums
export enum SortOrder {
  ASC = 1,
  DESC = 2,
}

type TableCellConfiguration = {
  label: string;
  dataTestId: string;
  key: string;
};

export const PROVIDER_SHIFTS_TABLE_CONFIGURATION: TableCellConfiguration[] = [
  {
    label: 'OTDT',
    dataTestId: PROVIDER_SHIFTS_TABLE_TEST_IDS.getHeaderColumnTestId('otdt'),
    key: 'otdt',
  },
  {
    label: 'En Route',
    dataTestId:
      PROVIDER_SHIFTS_TABLE_TEST_IDS.getHeaderColumnTestId('en-route'),
    key: 'en-route',
  },
  {
    label: 'On Scene',
    dataTestId:
      PROVIDER_SHIFTS_TABLE_TEST_IDS.getHeaderColumnTestId('on-scene'),
    key: 'on-scene',
  },
  {
    label: 'On Break',
    dataTestId:
      PROVIDER_SHIFTS_TABLE_TEST_IDS.getHeaderColumnTestId('on-break'),
    key: 'on-break',
  },
  {
    label: 'Idle Time',
    dataTestId:
      PROVIDER_SHIFTS_TABLE_TEST_IDS.getHeaderColumnTestId('idle-time'),
    key: 'idle-time',
  },
  {
    label: 'Visits',
    dataTestId: PROVIDER_SHIFTS_TABLE_TEST_IDS.getHeaderColumnTestId('visits'),
    key: 'visits',
  },
];
