const PROVIDER_SHIFTS_TABLE_ROOT = 'provider-shifts-table-root';
const PROVIDER_SHIFTS_TABLE_HEADER_PREFIX = 'provider-shifts-table-header';

export const PROVIDER_SHIFTS_TABLE_TEST_IDS = {
  PROVIDER_SHIFTS_TABLE_ROOT,
  getHeaderColumnTestId: (column: string) =>
    `${PROVIDER_SHIFTS_TABLE_HEADER_PREFIX}-${column}`,
};
