import { el } from '@*company-data-covered*/cypress-shared';
import { navigateTo } from '../helpers/navigationHelper';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  CreateVisitFromStationCRResponse,
  Visit,
} from '@*company-data-covered*/caremanager/data-access-types';
import { statsigHelper } from '@*company-data-covered*/caremanager/utils-e2e/statsig';

const UPCOMING_VISITS_SECTION = 'section-upcoming-visits';
const ACTIVE_VISITS_SECTION = 'section-active-visits';
const PAST_VISITS_SECTION = 'section-past-visits';
const EMPTY_ACTIVE_VISITS_MESSAGE = 'section-active-visits-section-empty-state';
const EMPTY_UPCOMING_VISITS_MESSAGE =
  'section-upcoming-visits-section-empty-state';
const EMPTY_PAST_VISITS_MESSAGE = 'section-past-visits-section-empty-state';
const getVisitCardTestAttribute = (id: string) =>
  `[data-testid=visit-card-${id}]`;

describe('Setup login, m2m token and feature flags overrides', () => {
  before(() => {
    cy.login();
    cy.getCareManagerServiceM2MToken();
  });

  beforeEach(() => {
    statsigHelper.overrideFeatureGate('visitsV1', true);
  });

  context('Visits list E2E empty list', () => {
    before(() => {
      cy.createEpisode();
    });

    beforeEach(() => {
      navigateTo({
        location: 'EPISODES_VISITS',
        id: Cypress.env('currentEpisodeId'),
      });
    });

    it('should display empty state for each category', () => {
      el(EMPTY_ACTIVE_VISITS_MESSAGE).isVisible();
      el(EMPTY_UPCOMING_VISITS_MESSAGE).isVisible();
      el(EMPTY_PAST_VISITS_MESSAGE).isVisible();
    });
  });

  context('Visits list E2E populated list', () => {
    let activeVisit: Visit | undefined,
      upcomingVisit: Visit | undefined,
      pastVisit: Visit | undefined;

    before(() => {
      const timestamp = new Date().getTime();
      const sourceCareRequestId = timestamp;
      const careRequestId1 = timestamp;
      const careRequestId2 = timestamp + 1;
      const careRequestId3 = timestamp + 2;
      cy.createVisitFromStationCR(
        careRequestId1,
        sourceCareRequestId,
        'accepted'
      ).then(
        (result: CreateVisitFromStationCRResponse) =>
          (upcomingVisit = result.visit)
      );
      cy.createVisitFromStationCR(
        careRequestId2,
        sourceCareRequestId,
        'on_route'
      ).then(
        (result: CreateVisitFromStationCRResponse) =>
          (activeVisit = result.visit)
      );
      cy.createVisitFromStationCR(
        careRequestId3,
        sourceCareRequestId,
        'completed'
      ).then(
        (result: CreateVisitFromStationCRResponse) => (pastVisit = result.visit)
      );
    });

    beforeEach(() => {
      navigateTo({
        location: 'EPISODES_VISITS',
        id: Cypress.env('currentVisitBody').episode_id,
      });
    });

    it('should display a visit in each category', () => {
      expect(upcomingVisit?.id).to.not.equal(undefined);
      expect(activeVisit?.id).to.not.equal(undefined);
      expect(pastVisit?.id).to.not.equal(undefined);
      el(UPCOMING_VISITS_SECTION)
        .find(getVisitCardTestAttribute(upcomingVisit?.id || ''))
        .isVisible();
      el(ACTIVE_VISITS_SECTION)
        .find(getVisitCardTestAttribute(activeVisit?.id || ''))
        .isVisible();
      el(PAST_VISITS_SECTION)
        .find(getVisitCardTestAttribute(pastVisit?.id || ''))
        .isVisible();
    });
  });
});
