import {
  SHIFT_TYPES,
  SUPPORTED_TEST_MARKETS,
  el,
} from '@*company-data-covered*/cypress-shared';
import { interceptGETVisitsList } from '@*company-data-covered*/caremanager/utils-e2e';
import { navigateTo } from '../helpers/navigationHelper';

/* Selectors */
const getVisitCard = (id: string) => `visit-card-${id}`;

/* Test Data */

const HEADERS = {
  Accept: 'application/vnd.*company-data-covered*.com; version=1',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/json',
};

describe('Care Requets Duplication via API', () => {
  before(() => {
    cy.dashboardLogin();
    cy.createShiftsIfNotExist({
      shifts: [{ shiftType: SHIFT_TYPES.acute_care, isVirtual: false }],
      market: SUPPORTED_TEST_MARKETS.daytonaBeach,
    });
  });
  it('should get Care Request ID', () => {
    cy.request({
      url: `${Cypress.env(
        'DASHBOARD_API_URL'
      )}/api/care_requests/billing?page=1&request_types=mobile%2Cmobile_android%2Cphone%2Cmanual_911%2Capi%2Cweb%2Cweb_mobile&market_ids=197&selected_filters=sign_chart
      `,
      method: 'GET',
      headers: { ...HEADERS },
    }).then((response) => {
      expect(response.status).to.eq(200);
      const data = response.body || [];

      const filtered = data.filter((value) => {
        if (value.patient.first_name === 'Cypress') {
          return true;
        }
      });

      const duplicateId = filtered.map((value) => {
        return value.id.toString();
      });

      Cypress.env('duplicateId', duplicateId);
    });
  });

  it('should duplicate Care Request ID', () => {
    cy.request({
      url: `${Cypress.env('DASHBOARD_API_URL')}/api/care_requests/${Cypress.env(
        'duplicateId'
      )}/duplicate`,
      method: 'POST',
      headers: { ...HEADERS },
    }).then((response) => {
      expect(response.status).to.eq(201);

      const duplicateCareRequestId = response.body.id;

      Cypress.env('duplicateCareRequestId', duplicateCareRequestId);
    });
  });
});

describe('Onboard Duplicate Care Request', () => {
  before(() => {
    cy.onboardingLogin();
  });
  it('should schedule duplicate care request', () => {
    const start = new Date();
    const end = new Date();

    start.setSeconds(start.getSeconds() + 100);
    end.setHours(end.getHours() + 4);

    Cypress.env('startTime', start);
    Cypress.env('endTime', end);

    return cy
      .request({
        url: `${Cypress.env(
          'AUTH0_ONBOARDING_API_URL'
        )}care-requests/${Cypress.env('duplicateCareRequestId')}`,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + Cypress.env('onboardingToken'),
        },
      })
      .then(() => {
        return cy.request({
          url: `${Cypress.env(
            'AUTH0_ONBOARDING_API_URL'
          )}care-requests/${Cypress.env('duplicateCareRequestId')}`,
          method: 'PATCH',
          headers: {
            ...HEADERS,
            Authorization: 'Bearer ' + Cypress.env('onboardingToken'),
          },
          body: {
            serviceLineId: 9,
          },
        });
      })
      .then((response) => {
        expect(response.status).to.eq(200);
      })
      .then(() => {
        return cy.request({
          url: `${Cypress.env(
            'AUTH0_ONBOARDING_API_URL'
          )}assign-team/eta-ranges`,
          method: 'POST',
          headers: {
            ...HEADERS,
            Authorization: 'Bearer ' + Cypress.env('onboardingToken'),
          },
          body: {
            careRequestId: Cypress.env('duplicateCareRequestId'),
            endsAt: Cypress.env('endTime'),
            startsAt: Cypress.env('startTime'),
            careRequestStatusId: Cypress.env('statusId'),
          },
        });
      })
      .then((response) => {
        expect(response.status).to.eq(201);
      })
      .then(() => {
        return cy.request({
          url: `${Cypress.env(
            'AUTH0_ONBOARDING_API_URL'
          )}care-requests/${Cypress.env('duplicateCareRequestId')}/status`,
          method: 'PATCH',
          headers: {
            ...HEADERS,
            Authorization: 'Bearer ' + Cypress.env('onboardingToken'),
          },
          body: {
            status: 'accepted',
          },
        });
      })
      .then((response) => {
        expect(response.status).to.eq(200);
      });
  });
});

describe('Verify new visit on existing episode', () => {
  before(() => {
    cy.login().then(() => {
      Cypress.config('baseUrl', Cypress.env('AUTH0_REDIRECT_URI'));
    });
    navigateTo({
      location: 'EPISODES_VISITS',
      id: Cypress.env('EPISODE_ID'),
    });
    interceptGETVisitsList({ mockResp: false });
  });
  it('should see new visit on existing episode', () => {
    cy.wait('@interceptGETVisitsList')
      .its('response.body.visits')
      .then((visit) => {
        const visitId = visit[0].id;
        el(getVisitCard(visitId)).isVisible();
      });
  });
});
