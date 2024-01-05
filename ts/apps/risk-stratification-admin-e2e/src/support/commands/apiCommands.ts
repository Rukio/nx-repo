import { loginUsers, type UserKey } from '../../fixtures/loginUsers';
import login from '../apiHelpers/login';

Cypress.Commands.add('login', (userType: UserKey = 'admin') => {
  const user = loginUsers[userType];
  cy.session(user.username, () => {
    login(user);
  });
});
