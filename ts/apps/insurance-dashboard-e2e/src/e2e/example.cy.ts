describe('example test', () => {
  it('should display welcome message', () => {
    cy.login();
    cy.visit('/');
  });
});
