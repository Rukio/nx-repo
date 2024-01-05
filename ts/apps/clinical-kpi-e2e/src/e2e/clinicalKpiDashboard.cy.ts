import { el } from '@*company-data-covered*/cypress-shared';
import {
  DISPATCH_HEALTH_LOGO_LINK,
  HEADER_GREETING_TEXT,
  HEADER_LAST_UPDATED_TEXT,
  HEADER_VISITS_COMPLETED_TEXT,
  HEADER_PERFORMANCE_TEXT,
  HEADER_LEARN_MORE_LINK,
  PEER_RANKINGS_MERTICS_SECTION_TITLE,
  MARKET_DROPDOWN_SELECT,
  TAB_ON_SCENE_TIME,
  TAB_CHART_CLOSURE_RATE,
  TAB_PATIENT_NPS,
  RANK_TABLE_VALUE,
  getMarketDropDownItem,
  APPBAR_STATION_DASHBOARD_LINK,
} from './helpers/selectors';
import { interceptGetProviderIndividualMetrics } from '../e2e/helpers/interceptHelper';
import { loginUsers } from '../fixtures/loginUsers';

const testDateMorning = () => {
  cy.clock(new Date(2023, 0, 21, 8, 0, 0), ['Date']);
  cy.reload();
};

const testDateAfternoon = () => {
  cy.clock(new Date(2023, 0, 21, 13, 0, 0), ['Date']);
  cy.reload();
};

const testDateEvening = () => {
  cy.clock(new Date(2023, 0, 21, 20, 0, 0), ['Date']);
  cy.reload();
};

describe('clinical kpi dashboard', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('localhost:4252');
    interceptGetProviderIndividualMetrics(loginUsers.provider.providerId);
  });

  it('should display correct app bar', () => {
    el(DISPATCH_HEALTH_LOGO_LINK)
      .isVisible()
      .hasHref('https://qa.*company-data-covered*.com/');
    el(APPBAR_STATION_DASHBOARD_LINK)
      .isVisible()
      .hasHref('https://qa.*company-data-covered*.com/');
  });

  it('should display correct date header morning', () => {
    cy.wait('@interceptGetProviderIndividualMetrics')
      .its('response.body.metrics')
      .then((metrics) => {
        cy.wrap(metrics.careRequestsCompletedLastSevenDays).should(
          'be.within',
          0,
          100
        );
        testDateMorning();
        el(HEADER_GREETING_TEXT).hasText('Good Morning');
        el(HEADER_LAST_UPDATED_TEXT).hasText('Last Updated:');
        el(HEADER_VISITS_COMPLETED_TEXT).hasText('Visits Completed Last Week:');
        el(HEADER_PERFORMANCE_TEXT).hasExactText(
          'Performance based on an 80 acute visit trailing average.'
        );
        el(HEADER_LEARN_MORE_LINK).hasExactText('Learn More');
      });
  });

  it('should display date header afternoon', () => {
    testDateAfternoon();
    el(HEADER_GREETING_TEXT).hasText('Good Afternoon');
  });

  it('should display date header evening', () => {
    testDateEvening();
    el(HEADER_GREETING_TEXT).hasText('Good Evening');
  });

  it('should display correct information for selected tabs', () => {
    el(PEER_RANKINGS_MERTICS_SECTION_TITLE).hasText('Peer Ranking');
    el(MARKET_DROPDOWN_SELECT).click();
    el(getMarketDropDownItem(159)).click();
    el(MARKET_DROPDOWN_SELECT).hasText('Denver');
    el(TAB_CHART_CLOSURE_RATE).click();
    el(RANK_TABLE_VALUE).hasText('Chart Closure');
    el(TAB_ON_SCENE_TIME).click();
    el(RANK_TABLE_VALUE).hasText('On Scene Time');
    el(TAB_PATIENT_NPS).click();
    el(RANK_TABLE_VALUE).hasText('NPS');
  });

  it('should display correct metrics on', () => {
    cy.wait('@interceptGetProviderIndividualMetrics')
      .its('response.body.metrics')
      .then((metrics) => {
        // validate On Scene time metrics
        cy.wrap(metrics.medianOnSceneTimeSecs / 60).should('be.within', 0, 100);
        cy.wrap((metrics.medianOnSceneTimeSecsChange * -1) / 60).should(
          'be.within',
          -100,
          100
        );
        // validate Chart Closure metrics
        cy.wrap(metrics.chartClosureRate).should('be.within', 0, 100);
        cy.wrap(metrics.chartClosureRateChange).should('be.within', -100, 100);
        // validate NPS metrics
        cy.wrap(metrics.averageNetPromoterScore).should('be.within', 0, 100);
        cy.wrap(metrics.averageNetPromoterScoreChange).should(
          'be.within',
          -100,
          100
        );
      });
  });
});
