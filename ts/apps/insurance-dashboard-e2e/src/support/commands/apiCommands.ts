import { loginUsers } from '../../fixtures/loginUsers';
import login from '../apiHelpers/login';

Cypress.Commands.add('login', (userType = 'admin') => {
  const user = loginUsers[userType];
  cy.session(user.username, () => {
    login(user);
  });
});
