import { el } from '@*company-data-covered*/cypress-shared';
import {
  EpisodeDetails,
  interceptGETConfigData,
  interceptGETEpisodes,
  patientDetailsCell,
} from '@*company-data-covered*/caremanager/utils-e2e';

describe('Episode List Cells', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETConfigData();
    cy.visit('/');
  });

  describe('Patient Cell', () => {
    describe('Incomplete Address', () => {
      beforeEach(() => {
        interceptGETEpisodes({ fixture: 'episodesIncompleteAddress' });
      });

      it('should display "-" for incomplete address information', () => {
        cy.fixture('apiResp/episodesIncompleteAddress').then((fixtureBody) => {
          fixtureBody.episodes.forEach((episode: EpisodeDetails) => {
            const {
              id,
              address_street,
              address_city,
              address_state,
              address_zipcode,
            } = episode.patient;

            el(patientDetailsCell(id)).hasText(
              `${address_street || '-'} ${address_city || '-'}, ${
                address_state || '-'
              } ${address_zipcode || '-'}`
            );
          });
        });
      });
    });

    describe('Empty Address', () => {
      beforeEach(() => {
        interceptGETEpisodes({ fixture: 'episodesEmptyAddress' });
      });

      it('should display "--" for empty address information', () => {
        cy.fixture('apiResp/episodesEmptyAddress').then(({ episodes }) => {
          episodes.forEach((episode: EpisodeDetails) => {
            const { id } = episode.patient;
            el(patientDetailsCell(id)).hasText('--');
          });
        });
      });
    });
  });
});
