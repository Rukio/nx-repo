const tableCellModalityPrefix = 'networks-table-cell-modality';
const tableNetworkRowPrefixText = 'networks-table-row';

export const NETWORKS_TABLE_TEST_IDS = {
  TABLE_NAME_SORT_LABEL: 'networks-table-name-sort-label',
  TABLE_LAST_UPDATED_SORT_LABEL: 'networks-table-last-updated-sort-label',
  TABLE_HEAD_CELL_NAME: 'networks-table-head-cell-name',
  TABLE_HEAD_CELL_LAST_UPDATED: 'networks-table-head-cell-last-updated',
  TABLE_HEAD_CELL_MODALITY: 'networks-table-head-cell-modality',
  TABLE_CELL_NAME: 'networks-table-cell-name',
  TABLE_CELL_LAST_UPDATED: 'networks-table-cell-last-updated',
  TABLE_CELL_MODALITY_PREFIX: tableCellModalityPrefix,
  TABLE_CELL_MODALITY_CHECK_ICON: `${tableCellModalityPrefix}-icon-checked`,
  TABLE_PAGINATION: 'networks-table-pagination',
  getModalityCellTestId: (modalityId: number) =>
    `${tableCellModalityPrefix}-${modalityId}`,
  TABLE_ROOT: 'networks-table',
  TABLE_ROW_PREFIX: tableNetworkRowPrefixText,
  getNetworkRowTestId: (networkId: number | string) =>
    `${tableNetworkRowPrefixText}-${networkId}`,
  TABLE_NO_RESULTS_TEXT: 'networks-table-no-results-text',
};
