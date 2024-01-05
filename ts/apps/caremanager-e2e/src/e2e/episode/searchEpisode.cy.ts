import {
  calculateAge,
  formattedDOB,
  sexStringToChar,
} from '@*company-data-covered*/caremanager/utils';
import {
  interceptGETEpisodes,
  patientDetailsCell,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';
import { navigateTo } from '../helpers/navigationHelper';

/* Selectors */
const EPISODES_SEARCH_INPUT = 'search-input';
const CLEAR_BUTTON = 'clear-button';
const NO_EPISODES_TEXT = 'no-episodes-text';

describe('Search Episode', () => {
  before(() => {
    cy.login();
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
  });

  it('should find an existing episode', () => {
    el(CLEAR_BUTTON).click({ force: true });
    el(EPISODES_SEARCH_INPUT)
      .hasPlaceholder('Search by patient name')
      .clear()
      .type('CareManager');

    interceptGETEpisodes({ mockResp: false });
    cy.wait('@interceptGETEpisodes').then((request) => {
      const {
        address_city,
        address_state,
        address_street,
        address_zipcode,
        first_name,
        last_name,
        id,
        date_of_birth,
        sex,
        phone_number,
      } = request.response.body.episodes[0].patient;

      el(patientDetailsCell(id))
        .hasText(first_name)
        .hasText(last_name)
        .hasText(formattedDOB(date_of_birth))
        .hasText(`${calculateAge(date_of_birth)}yo ${sexStringToChar(sex)}`)
        .hasText(
          `${address_street} ${address_city}, ${address_state} ${address_zipcode}`
        )
        .hasText(phone_number);
    });
  });

  it('should not find an existing episode', () => {
    el(EPISODES_SEARCH_INPUT).clear().type('DOES NOT EXIST');
    el(NO_EPISODES_TEXT).hasText('No episodes found');
  });
});
