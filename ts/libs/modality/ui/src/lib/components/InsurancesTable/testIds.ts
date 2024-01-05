const tableCellModalityPrefix = 'insurances-table-cell-modality';
const tableInsurancePlansRowPrefixText = 'insurances-table-row';

export const INSURANCE_TABLE_TEST_IDS = {
  TABLE_NAME_SORT_LABEL: 'insurances-table-name-sort-label',
  TABLE_LAST_UPDATED_SORT_LABEL: 'insurances-table-last-updated-sort-label',
  TABLE_HEADER_CELL_NAME: 'insurances-table-header-cell-name',
  TABLE_HEADER_CELL_LAST_UPDATED: 'insurances-table-header-cell-last-updated',
  TABLE_CELL_NAME: 'insurances-table-cell-name',
  TABLE_CELL_IN_PERSON: 'insurances-table-cell-in-person',
  TABLE_CELL_TELE_P: 'insurances-table-cell-tele-p',
  TABLE_CELL_VIRTUAL: 'insurances-table-cell-virtual',
  TABLE_CELL_LAST_UPDATED: 'insurances-table-cell-last-updated',
  TABLE_CELL_HEAD_MODALITY: 'insurances-table-cell-head-modality',
  TABLE_CELL_MODALITY_PREFIX: tableCellModalityPrefix,
  TABLE_PAGINATION: 'insurances-table-pagination',
  getModalityCellTestId: (modalityId: number) =>
    `${tableCellModalityPrefix}-${modalityId}`,
  TABLE_ROOT: 'insurance-plans-table',
  TABLE_ROW_PREFIX: tableInsurancePlansRowPrefixText,
  getInsurancePlanRowTestId: (insurancePlanId: number) =>
    `${tableInsurancePlansRowPrefixText}-${insurancePlanId}`,
  TABLE_NO_RESULTS_TEXT: 'insurances-table-no-results-text',
};
