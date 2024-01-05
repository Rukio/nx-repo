import {
  CARE_REQUEST_STATUSES,
  SHIFT_TYPES,
  SUPPORTED_TEST_MARKETS,
  el,
  timeoutOptions,
} from '@*company-data-covered*/cypress-shared';

/*Selectors */
export const CLEAR_BUTTON = 'clear-button';
export const FULL_PATIENT_DETAILS_BUTTON = 'full-patient-details-button';
export const getPatientDetailsLink = (cmId: string) =>
  `patient-details-link-${cmId}`;
const DASHBOARD_API_URL = Cypress.env('DASHBOARD_API_URL');
const CAREMANAGER_URL = Cypress.env('AUTH0_REDIRECT_URI');
const VISIT_STATUS_UPDATE_BUTTON = 'visit-status-update-button';

export function visitStatusReponse(route: string, retries = 10) {
  el(VISIT_STATUS_UPDATE_BUTTON).click();
  cy.wait(route)
    .its('response.statusCode')
    .then((response) => {
      if (response === 200) {
        for (let i = 0; i < 3; i++) {
          el(VISIT_STATUS_UPDATE_BUTTON).click();
        }
      } else if (retries > 0) {
        cy.wait(timeoutOptions.SHORT_MS);
        visitStatusReponse(route, retries - 1);
      }
    });
}

export function setupE2ECareRequest() {
  cy.dashboardLogin()
    .then(() => {
      return cy.archiveOpenCareRequests({
        statuses: [CARE_REQUEST_STATUSES.accepted],
        marketIds: `${SUPPORTED_TEST_MARKETS.daytonaBeach.id}`,
      });
    })
    .then(() => cy.setupCareRequest())
    .then((careRequestId) => {
      Cypress.config('baseUrl', DASHBOARD_API_URL);

      return cy
        .setupCareRequestAssignment({
          assignmentInfo: {
            market: SUPPORTED_TEST_MARKETS.daytonaBeach,
            shifts: [
              {
                shiftType: SHIFT_TYPES.acute_care,
                endShiftIn4Hours: true,
              },
            ],
            crId: careRequestId,
          },
        })
        .then(() => {
          const { id: shiftId } = Cypress.env('currentShiftsInfo')[0];
          cy.updateCareRequestStatus({
            id: careRequestId,
            status: CARE_REQUEST_STATUSES.accepted,
            shiftTeamId: shiftId,
          });
        });
    })
    .then(() => Cypress.config('baseUrl', CAREMANAGER_URL));
}
