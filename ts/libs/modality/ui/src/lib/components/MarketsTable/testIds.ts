const tableMarketRowPrefixText = 'markets-table-row';
const tableCellModalityPrefix = 'markets-table-cell-modality';

export const MARKETS_TABLE_TEST_IDS = {
  TABLE_CELL_NAME: 'markets-table-cell-name',
  TABLE_CELL_HEAD_MODALITY: 'markets-table-cell-head-modality',
  TABLE_CELL_IN_PERSON: 'markets-table-cell-in-person',
  TABLE_CELL_TELE_P: 'markets-table-cell-tele-p',
  TABLE_CELL_VIRTUAL: 'markets-table-cell-virtual',
  TABLE_PAGINATION: 'markets-table-pagination',
  TABLE_ROW_PREFIX: tableMarketRowPrefixText,
  TABLE_CELL_MODALITY_PREFIX: tableCellModalityPrefix,
  TABLE_ROOT: 'markets-table',
  getMarketRowTestId: (marketId: number) =>
    `${tableMarketRowPrefixText}-${marketId}`,
  getModalityCellTestId: (modalityId: number) =>
    `${tableCellModalityPrefix}-${modalityId}`,
};
