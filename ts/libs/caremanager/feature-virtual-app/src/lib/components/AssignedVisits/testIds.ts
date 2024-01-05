export const ASSIGNED_VISITS_TEST_IDS = {
  ROOT: 'caremanager-assigned-visits',
};

export const ASSIGNED_VISITS_HEADER_TEST_IDS = {
  root: 'caremanager-assigned-visits-header-root',
  onCallDoctorsButton: 'caremanager-assigned-visits-header-on-call-doctors',
  openAthena: 'caremanager-assigned-visits-header-open-athena',
  openTytoCare: 'caremanager-assigned-visits-header-open-tytocare',
};

export const VISITS_ACCORDION_TEST_IDS = {
  ROOT: (testId: string) => `visit-accordion-${testId}`,
  HEADER: (testId: string) => `visit-accordion-header-${testId}`,
  TITLE: (testId: string) => `visit-accordion-title-${testId}`,
};
