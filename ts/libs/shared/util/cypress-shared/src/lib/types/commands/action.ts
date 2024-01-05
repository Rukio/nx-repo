/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Custom command to select a DOM element by data-testid attribute.
     * @example cy.getByTestId('data-test-id-attribute')
     */
    getByTestId(
      testId: string,
      options: Record<string, unknown>
    ): Chainable<Element> | Chainable<JQuery<HTMLElement>>;

    /**
     * Custom command that skips tests based on a given flag state.
     * @example cy.onlyOn(featureFlags.myFlag())
     */
    onlyOn(enabled: boolean): void;

    /**
     * Custom command that dispatches redux actions to the redux store.
     * @example cy.dispatch(callerUpdateAction)
     */
    dispatch(action: DispatchData): void;

    /**
     * Custom command that gets a specific child input in a radio group
     * @example el(GENDER_RADIO_GROUP).getRadioOption('Male')
     */
    getRadioOption(
      option: string
    ): Chainable<Element> | Chainable<JQuery<HTMLElement>>;

    /**
     * Custom command that drags an element on a page
     * @example el(MY_ELEMENT).dragTo(100, -100)
     */
    dragTo(
      x: number,
      y: number
    ): Chainable<Element> | Chainable<JQuery<HTMLElement>>;
  }
}

type DispatchData = {
  type: string;
  payload: Record<string, unknown>;
};
