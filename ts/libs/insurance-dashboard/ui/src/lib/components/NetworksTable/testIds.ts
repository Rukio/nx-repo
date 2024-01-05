const tableNetworkRowPrefixText = 'networks-table-row';
const tableNetworkRowNetworkCellPrefixText = 'networks-table-row-network-cell';
const tableNetworkRowStateCellPrefixText = 'networks-table-row-state-cell';
const tableNetworkRowServiceLineCellPrefixText =
  'networks-table-row-service-line-cell';
const tableNetworkRowClassificationCellPrefixText =
  'networks-table-row-classification-cell';
const tableNetworkRowPackageIdCellPrefixText =
  'networks-table-row-package-id-cell';
const tableNetworkRowLinkPrefixText = 'networks-table-row-link';
const tableNetworkRowExpandedPrefixText = 'networks-table-row-expanded';
const tableNetworkRowCollapsedPrefixText = 'networks-table-row-collapsed';
const tableNetworkRowCollapsedCounterChipsPrefixText =
  'networks-table-row-collapsed-counter-chips';

export const NETWORKS_TABLE_TEST_IDS = {
  ROOT: 'networks-table-root',
  HEADER_CELL_NETWORKS_SORT_BY_NAME_LABEL:
    'networks-table-header-cell-sort-by-name-label',
  HEADER_CELL_NETWORKS_SORT_BY_UPDATED_AT_LABEL:
    'networks-table-header-cell-sort-by-updated-at-label',
  HEADER_CELL_NETWORKS: 'networks-table-header-cell-networks',
  HEADER_CELL_STATES: 'networks-table-header-cell-states',
  HEADER_CELL_NETWORK_CLASSIFICATION:
    'networks-table-header-cell-classification',
  HEADER_CELL_NETWORK_PACKAGE_ID: 'networks-table-header-cell-package-id',
  HEADER_CELL_LAST_UPDATED: 'networks-table-header-cell-last-updated',
  TABLE_PAGINATION: 'networks-table-pagination',
  TABLE_ROW_PREFIX: tableNetworkRowPrefixText,
  TABLE_ROW_LINK_PREFIX: tableNetworkRowLinkPrefixText,
  TABLE_ROW_NETWORK_CELL_PREFIX: tableNetworkRowNetworkCellPrefixText,
  TABLE_ROW_STATE_CELL_PREFIX: tableNetworkRowStateCellPrefixText,
  TABLE_ROW_SERVICE_LINE_CELL_PREFIX: tableNetworkRowServiceLineCellPrefixText,
  TABLE_ROW_CLASSIFICATION_CELL_PREFIX:
    tableNetworkRowClassificationCellPrefixText,
  TABLE_ROW_PACKAGE_ID_CELL_PREFIX: tableNetworkRowPackageIdCellPrefixText,
  getNetworkRowTestId: (networkId: number) =>
    `${tableNetworkRowPrefixText}-${networkId}`,
  getNetworkRowStateCellTestId: (networkId: number) =>
    `${tableNetworkRowStateCellPrefixText}-${networkId}`,
  getNetworkRowStateCellValueTestId: (networkId: number, state: string) =>
    `${tableNetworkRowStateCellPrefixText}-${networkId}-${state}`,
  getNetworkRowServiceLineCellValueTestId: (
    networkId: number,
    serviceLineId: number
  ) =>
    `${tableNetworkRowServiceLineCellPrefixText}-${networkId}-${serviceLineId}`,
  getNetworkRowClassificationCellValueTestId: (networkId: number) =>
    `${tableNetworkRowClassificationCellPrefixText}-${networkId}`,
  getNetworkRowPackageIdCellValueTestId: (networkId: number) =>
    `${tableNetworkRowPackageIdCellPrefixText}-${networkId}`,
  getNetworkRowLinkTestId: (networkId: number) =>
    `${tableNetworkRowLinkPrefixText}-${networkId}`,
  getNetworkRowExpandedTestId: (networkId: number) =>
    `${tableNetworkRowExpandedPrefixText}-${networkId}`,
  getNetworkRowCollapsedTestId: (networkId: number) =>
    `${tableNetworkRowCollapsedPrefixText}-${networkId}`,
  getNetworkRowCollapsedCounterChipsTestId: (networkId: number) =>
    `${tableNetworkRowCollapsedCounterChipsPrefixText}-${networkId}`,
};
