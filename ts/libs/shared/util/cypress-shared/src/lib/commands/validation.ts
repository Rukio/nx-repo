/** Validate an element is visible in the DOM */
Cypress.Commands.add('isVisible', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible');
});

/** Validate an element is hidden in the DOM */
Cypress.Commands.add('isHidden', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.hidden');
});

/**
 * Validate an element is visible and contains the expected text
 * @param  {String} text expected text of the previous element
 */
Cypress.Commands.add('hasText', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).isVisible().and('contain', text);
});

/**
 * Validate an element is visible and contains ONLY the expected text
 * @param  {String} text expected text of the previous element
 */
Cypress.Commands.add(
  'hasExactText',
  { prevSubject: 'element' },
  (subject, text) => {
    cy.wrap(subject).isVisible().should('have.text', text);
  }
);

/**
 * Validate an element has the expected value
 * @param  {String} value expected value of the previous element
 */
Cypress.Commands.add(
  'hasValue',
  { prevSubject: 'element' },
  (subject, value) => {
    cy.wrap(subject).invoke('val').should('be.eq', value);
  }
);

/** Validate an element is enabled */
Cypress.Commands.add('isEnabled', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.enabled');
});

/** Validate an element is disabled */
Cypress.Commands.add('isDisabled', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.disabled');
});

/** Validate an element is checked */
Cypress.Commands.add('isChecked', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.checked');
});

/** Validate an element is unchecked */
Cypress.Commands.add('isUnchecked', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('not.be.checked');
});

/** * Validate a Material UI toggle button is selected */
Cypress.Commands.add('isToggled', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('have.class', 'Mui-selected');
});

/** Validate a Material UI toggle button is not selected */
Cypress.Commands.add('isNotToggled', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('not.have.class', 'Mui-selected');
});

/**
 * Validate a dropdown's selected <option> contains the expected value
 * @param  {String} value expected value of the previous element
 */
Cypress.Commands.add(
  'hasSelected',
  { prevSubject: 'element' },
  (subject, value) => {
    cy.wrap(subject).find(':selected').should('contain', value);
  }
);

/**
 * Validate the class of an element
 * @param {string} value expected class name element being active
 *  */
Cypress.Commands.add(
  'hasClass',
  { prevSubject: 'element' },
  (subject, value) => {
    cy.wrap(subject).should('have.attr', 'class', value);
  }
);

/**
 * Validate an element has the expected href attribute value
 *  @param  {String} value expected href attribute value of the previous element
 */
Cypress.Commands.add(
  'hasHref',
  { prevSubject: 'element' },
  (subject, value) => {
    cy.wrap(subject).should('have.attr', 'href', value);
  }
);

/**
 * Validate an element has the expected placeholder attribute value
 * @param  {String} value expected placeholder attribute value of the previous element
 */
Cypress.Commands.add(
  'hasPlaceholder',
  { prevSubject: 'element' },
  (subject, value) => {
    cy.wrap(subject).should('have.attr', 'placeholder', value);
  }
);

/** Validate an element has a required attribute */
Cypress.Commands.add(
  'hasRequiredAttribute',
  { prevSubject: 'element' },
  (subject) => {
    cy.wrap(subject).should('have.attr', 'required');
  }
);

/** Validate an element has the required class and contains the missing required field error */
Cypress.Commands.add(
  'hasRequiredError',
  { prevSubject: 'element' },
  (subject) => {
    cy.wrap(subject)
      .should('have.class', 'required')
      .siblings('div')
      .last()
      .contains("can't be blank", { matchCase: false });
  }
);

/**
 * Validate the length of a list of elements
 * @param  {Number} length expected length of the element list
 */
Cypress.Commands.add(
  'hasLengthOf',
  { prevSubject: 'element' },
  (subject, length) => {
    cy.wrap(subject).should('have.length', length);
  }
);

/**
 * Validate a dropdown contains the expected option children length
 * @param  {Number} length expected length of the dropdown's children
 * @param  {String} childTag expected html tag of the dropdown's children, option by default.
 */
Cypress.Commands.add(
  'hasDropdownOptionLengthOf',
  { prevSubject: 'element' },
  (subject, length, childTag = 'option') => {
    cy.wrap(subject).find(childTag).hasLengthOf(length);
  }
);

/**
 * Validate an MUI progress bar has the expected value
 * @param  {String} value expected value of the progress bar
 */
Cypress.Commands.add(
  'hasProgressBarValue',
  { prevSubject: 'element' },
  (subject, value) => {
    cy.wrap(subject).isVisible().should('have.attr', 'aria-valuenow', value);
  }
);

/**
 * Validate location path
 * @param  {String} path expected location path
 */
Cypress.Commands.add('validateLocationPath', (path) => {
  cy.location().should((loc) => {
    expect(loc.pathname).to.eq(path);
  });
});
