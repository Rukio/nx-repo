const PROVIDER_VISITS_TABLE_TEST_ID = 'provider-visits-table';

export const PROVIDER_VISITS_TABLE_TEST_IDS = {
  TABLE: PROVIDER_VISITS_TABLE_TEST_ID,
  getPatientName: (careRequestId: string) =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-patient-name-${careRequestId}`,
  getAthenaId: (careRequestId: string) =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-athena-id-${careRequestId}`,
  getDate: (careRequestId: string) =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-date-${careRequestId}`,
  getChiefComplaint: (careRequestId: string) =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-chief-complaint-${careRequestId}`,
  getDiagnosis: (careRequestId: string) =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-diagnosis-${careRequestId}`,
  getEscalated: (careRequestId: string) =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-escalated-${careRequestId}`,
  getAbx: (careRequestId: string) =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-abx-${careRequestId}`,
  HEADER: `${PROVIDER_VISITS_TABLE_TEST_ID}-header`,
  buildHeaderColumnTestId: (key: string): string =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-header-${key}`,
  getCellSkeleton: (tableRowIndex: number, key: string): string =>
    `${PROVIDER_VISITS_TABLE_TEST_ID}-skeleton-${tableRowIndex}-${key}`,
};
