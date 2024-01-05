const tablePayerRowPrefixText = 'payers-table-row';
const tablePayerRowNetworkCellPrefixText = 'payers-table-row-network-cell';
const tablePayerRowNetworkNameCellPrefixText =
  'payers-table-row-network-name-cell';
const tablePayerRowGroupCellTestId = 'payers-table-row-group-cell';
const tablePayerRowExpandCellTestId = 'payers-table-row-expand-icon-cell';
const tablePayerRowLastUpdatedCellTestId = 'payers-table-row-last-updated-cell';
const tablePayerRowStateCellPrefixText = 'payers-table-row-state-cell';
const tablePayerRowExpandedText = 'payers-table-row-expanded';
const tablePayerRowCollapsedText = 'payers-table-row-collapsed';
const tablePayerRowCollapsedCounterChipsText =
  'payers-table-row-collapsed-counter-chips';
const tablePayerRowLinkPrefixText = 'payers-table-row-link';

export const PAYERS_TABLE_TEST_IDS = {
  TABLE_ROOT: 'payers-table-root',
  TABLE_HEADER_CELL_PAYER: 'payers-table-header-cell-payer',
  TABLE_HEADER_CELL_PAYER_SORT_BY_NAME_LABEL:
    'payers-table-header-cell-payer-sort-by-name-label',
  TABLE_HEADER_CELL_PAYER_SORT_BY_UPDATED_AT_LABEL:
    'payers-table-header-cell-payer-sort-by-updated-at-label',
  TABLE_HEADER_CELL_NETWORKS: 'payers-table-header-cell-networks',
  TABLE_HEADER_CELL_STATES: 'payers-table-header-cell-states',
  TABLE_HEADER_CELL_PAYER_GROUP: 'payers-table-header-cell-payer-group',
  TABLE_HEADER_CELL_LAST_UPDATED: 'payers-table-header-cell-last-updated',
  TABLE_PAGINATION: 'payers-table-pagination',
  TABLE_ROW_PREFIX: tablePayerRowPrefixText,
  TABLE_ROW_NETWORK_CELL_PREFIX: tablePayerRowNetworkCellPrefixText,
  TABLE_ROW_NAME_CELL_PREFIX: tablePayerRowNetworkNameCellPrefixText,
  TABLE_ROW_STATE_CELL_PREFIX: tablePayerRowStateCellPrefixText,
  TABLE_ROW_EXPANDED: tablePayerRowExpandedText,
  TABLE_ROW_COLLAPSED: tablePayerRowCollapsedText,
  getPayerRowTestId: (payerId: number) =>
    `${tablePayerRowPrefixText}-${payerId}`,
  getPayerRowNetworkCellTestId: (payerId: number) =>
    `${tablePayerRowNetworkCellPrefixText}-${payerId}`,
  getPayerRowNetworkNameCellTestId: (payerId: number) =>
    `${tablePayerRowNetworkNameCellPrefixText}-${payerId}`,
  getPayerRowGroupCellTestId: (payerId: number) =>
    `${tablePayerRowGroupCellTestId}-${payerId}`,
  getPayerRowGroupCellTooltipTestId: (payerId: number) =>
    `${tablePayerRowGroupCellTestId}-${payerId}-tooltip`,
  getPayerRowGroupCellPayerGroupNameTestId: (payerId: number) =>
    `${tablePayerRowGroupCellTestId}-${payerId}-payer-group-name`,
  getPayerRowLastUpdatedCellTestId: (payerId: number) =>
    `${tablePayerRowLastUpdatedCellTestId}-${payerId}`,
  getPayerRowExpandCellTestId: (payerId: number) =>
    `${tablePayerRowExpandCellTestId}-${payerId}`,
  getPayerRowStateCellTestId: (payerId: number) =>
    `${tablePayerRowStateCellPrefixText}-${payerId}`,
  getPayerRowLinkTestId: (payerId: number) =>
    `${tablePayerRowLinkPrefixText}-${payerId}`,
  getPayerRowStateCellValueTestId: (
    payerId: number,
    stateId: number | string
  ) => `${tablePayerRowStateCellPrefixText}-${payerId}-${stateId}`,
  getPayerRowNetworkCellValueTestId: (
    payerId: number,
    networkId: number | string
  ) => `${tablePayerRowNetworkCellPrefixText}-${payerId}-${networkId}`,
  getPayerRowExpandedTestId: (payerId: number) =>
    `${tablePayerRowExpandedText}-${payerId}`,
  getPayerRowCollapsedTestId: (payerId: number) =>
    `${tablePayerRowCollapsedText}-${payerId}`,
  getPayerRowCollapsedCounterChipsTestId: (payerId: number, cellName: string) =>
    `${tablePayerRowCollapsedCounterChipsText}-${payerId}-${cellName}`,
};
