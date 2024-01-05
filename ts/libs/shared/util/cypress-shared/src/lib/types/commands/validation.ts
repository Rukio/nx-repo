/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Custom command that validates an element is visible in the DOM.
     * @example el(MY_INPUT).isVisible()
     */
    isVisible(): Chainable<Element>;

    /**
     * Custom command that validates an element is hidden in the DOM.
     * @example el(MY_INPUT).isHidden()
     */
    isHidden(): Chainable<Element>;

    /**
     * Custom command that validates an element is visible and contains the expected text
     * @example el(MY_LABEL).hasText('label')
     */
    hasText(text: string): Chainable<Element>;

    /**
     * Custom command that validates an element is visible and contains only the expected text
     * @example el(MY_LABEL).hasExactText('label')
     */
    hasExactText(text: string): Chainable<Element>;

    /**
     * Custom command that validates an element contains the expected value
     * @example el(MY_PHONE_NUMBER_INPUT).hasValue('(123)-456-7890)
     */
    hasValue(value: string): Chainable<Element>;

    /**
     * Custom command that validates if a element is enabled
     * @example el(MY_BUTTON).isEnabled()
     */
    isEnabled(): Chainable<Element>;

    /**
     * Custom command that validates if a element is disabled
     * @example el(MY_BUTTON).isDisabled()
     */
    isDisabled(): Chainable<Element>;

    /**
     * Custom command that validates if a element is checked
     * @example el(MY_CHECKBOX).isChecked()
     */
    isChecked(): Chainable<Element>;

    /**
     * Custom command that validates if a element is unchecked
     * @example el(MY_CHECKBOX).isUnchecked()
     */
    isUnchecked(): Chainable<Element>;

    /**
     * Custom command that validates if a Material UI toggle is selected
     * @example el(MY_TAB).isToggled()
     */
    isToggled(): Chainable<Element>;

    /**
     * Custom command that validates if a Material UI toggle is not selected
     * @example el(MY_TAB).isNotToggled()
     */
    isNotToggled(): Chainable<Element>;

    /**
     * Custom command that validates a dropdown's selected <option> contains the expected value
     * @example el(MY_DROPDOWN).hasSelected('option')
     */
    hasSelected(value: string): Chainable<Element>;

    /**
     * Custom command that validates an element has an exepcted class value
     * @example el(MY_INPUT).hasClass('active')
     */
    hasClass(value: string): Chainable<Element>;

    /**
     * Custom command that validates an element has the expected href attribute value
     * @example el(MY_LINK).hasHref('/request-care/location')
     */
    hasHref(value: string): Chainable<Element>;

    /**
     * Custom command that validates an element has the expected placeholder attribute value
     * @example el(MY_DATE_INPUT).hasPlaceholder('mm/dd/yyyy')
     */
    hasPlaceholder(value: string): Chainable<Element>;

    /**
     * Custom command that validates an has a required attribute
     * @example el(MY_INPUT).hasRequiredAttribute()
     */
    hasRequiredAttribute(): Chainable<Element>;

    /**
     * Custom command that validates an element has required class and contains the missing required field error text
     * @example el(MY_INPUT).hasRequiredError()
     */
    hasRequiredError(): Chainable<Element>;

    /**
     * Custom command that validates the length of a list of elements
     * @example el(MY_LIST).children().hasLengthOf(10)
     */
    hasLengthOf(length: number): Chainable<Element>;

    /**
     * Custom command that validates a dropdown contains the expected option children length
     * @example el(MY_DROPDOWN).hasDropdownOptionLengthOf(10)
     */
    hasDropdownOptionLengthOf(
      length: number,
      childTag: string
    ): Chainable<Element>;

    /**
     * Custom command that validates an MUI progress bar has the correct value
     * @example el(MY_PROGRESS_BAR).hasProgressBarValue('50')
     */
    hasProgressBarValue(value: string): Chainable<Element>;

    /**
     * Custom command that validates location path
     * @example cy.validateLocationPath('/')
     */
    validateLocationPath(path: string): Chainable<Element>;
  }
}
