import { el } from '@*company-data-covered*/cypress-shared';
import {
  APP_BAR_CONTAINER,
  CREATE_ADDRESS_FORM_TEST_IDS,
} from './helpers/selectors';
import { STATES } from './helpers/states';

describe('Add Address', () => {
  beforeEach(() => cy.visit('/addresses/create'));

  it('should render initial state  correctly', () => {
    el(APP_BAR_CONTAINER).isVisible();
    el(CREATE_ADDRESS_FORM_TEST_IDS.PAGE).isVisible();

    el(CREATE_ADDRESS_FORM_TEST_IDS.TITLE).isVisible().contains('Add Address');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_1_INPUT)
      .isVisible()
      .hasPlaceholder('Address');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_2_INPUT)
      .isVisible()
      .hasPlaceholder('Unit Number');

    el(CREATE_ADDRESS_FORM_TEST_IDS.LOCATION_DETAILS_INPUT)
      .isVisible()
      .hasPlaceholder('Location Details');

    el(CREATE_ADDRESS_FORM_TEST_IDS.CITY_INPUT)
      .isVisible()
      .hasPlaceholder('City');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STATE).isVisible().contains('State');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STATE).click();

    STATES.forEach((option) => {
      el(
        CREATE_ADDRESS_FORM_TEST_IDS.getCreateAddressFormStateOptionTestId(
          option.abbreviation
        )
      ).contains(option.name);
    });

    el(CREATE_ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT)
      .isVisible()
      .hasPlaceholder('ZIP Code');

    el(CREATE_ADDRESS_FORM_TEST_IDS.SUBMIT_BUTTON)
      .isVisible()
      .contains('Save')
      .isDisabled();
  });

  it('should navigate to landing page when back button is clicked', () => {
    el(CREATE_ADDRESS_FORM_TEST_IDS.BACK_BUTTON)
      .isVisible()
      .contains('Settings');

    el(CREATE_ADDRESS_FORM_TEST_IDS.BACK_BUTTON).click();

    cy.validateLocationPath('/');
  });

  it('should show an error when required fields are touched and empty', () => {
    el(CREATE_ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_1_INPUT).click().blur();

    el(CREATE_ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_1_FORM_CONTROL)
      .isVisible()
      .within(() => cy.get('p').contains('Street Address is required'));

    el(CREATE_ADDRESS_FORM_TEST_IDS.CITY_INPUT).click().blur();

    el(CREATE_ADDRESS_FORM_TEST_IDS.CITY_FORM_CONTROL)
      .isVisible()
      .within(() => cy.get('p').contains('City is required'));
    el(CREATE_ADDRESS_FORM_TEST_IDS.STATE).dblclick();

    // to close the select
    cy.get('body').type('{esc}');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_1_INPUT).click().blur();

    el(CREATE_ADDRESS_FORM_TEST_IDS.STATE_FORM_CONTROL)
      .isVisible()
      .within(() => cy.get('p').contains(`State is required`));
  });

  it('should redirect to landing page when form submitted', () => {
    el(CREATE_ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_1_INPUT)
      .isVisible()
      .type('Address');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_2_INPUT)
      .isVisible()
      .type('Unit Number');

    el(CREATE_ADDRESS_FORM_TEST_IDS.LOCATION_DETAILS_INPUT)
      .isVisible()
      .type('Location Details');

    el(CREATE_ADDRESS_FORM_TEST_IDS.CITY_INPUT).isVisible().type('City');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STATE).isVisible().contains('State');

    el(CREATE_ADDRESS_FORM_TEST_IDS.STATE).click();

    el(
      CREATE_ADDRESS_FORM_TEST_IDS.getCreateAddressFormStateOptionTestId(
        STATES[0].abbreviation
      )
    ).click();

    el(CREATE_ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT).isVisible().type('12345');

    el(CREATE_ADDRESS_FORM_TEST_IDS.SUBMIT_BUTTON)
      .isVisible()
      .contains('Save')
      .click();

    cy.validateLocationPath('/');
  });
});
