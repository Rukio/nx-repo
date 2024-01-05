/**
 * Helper used to fetch DOM elements
 * @param {string} testId - data-testid attribute value of the desired element
 * @param {Record<string, any>} options - Additional param to change the default behavior of cy.get
 */
const el = (
  testId: string,
  options = { timeout: Cypress.env('defaultCommandTimeout') }
) => cy.getByTestId(testId, options);

export default el;
