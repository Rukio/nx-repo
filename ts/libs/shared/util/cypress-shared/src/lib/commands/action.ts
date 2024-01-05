/**
 * Action that uniquely selects elements in the DOM
 * @param  {String} testId value of the data-testid attribute
 * @param  {Object} options additional options to control behavior of cy.get
 */

const FORMAT_CHARS = [' ', '_'];
Cypress.Commands.add('getByTestId', (testId, options) => {
  let formattedTestId: string = testId;
  if (FORMAT_CHARS.some((fc) => formattedTestId.includes(fc))) {
    formattedTestId = testId.replaceAll(/[ _]/g, '-').toLowerCase();
  }

  return cy.get(`[data-testid=${formattedTestId}]`, options);
});

/**
 * Action that skips tests based on a given flag
 * @param {Boolean} enabled represents a conditional, typically the value of a feature flag
 */
Cypress.Commands.add('onlyOn', (enabled) => {
  if (enabled !== true) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore "cy.state" is not in the "cy" type
    cy.state('runnable').ctx.skip();
  }
});

/**
 * Action that dispatches redux actions to the redux store
 * @param  {Object} action redux store action
 */
Cypress.Commands.add('dispatch', (action) => {
  Cypress.log({
    name: 'dispatchReduxAction',
  });

  cy.window().its('store').invoke('dispatch', action);
});

/** Action that get a specific child input in a radio group
 * @param {String} option specific option in the radio group array
 */
Cypress.Commands.add(
  'getRadioOption',
  { prevSubject: true },
  (subject, option) => {
    cy.wrap(subject).contains(option).siblings('input');
  }
);

/** Action that moves an element around a page by mimicking mouse actions
 * @param {Number} x amount of pixels to drag the element horizontally
 * @param {Number} y amount of pixes to drag the element vertically
 */
Cypress.Commands.add('dragTo', { prevSubject: 'element' }, (subject, x, y) => {
  cy.wrap(subject)
    .trigger('mousedown', { which: 1 })
    .trigger('mousemove', x, y, { force: true })
    .trigger('mouseup', { force: true });
});
