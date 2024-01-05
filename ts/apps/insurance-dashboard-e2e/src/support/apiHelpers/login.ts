import { Request } from '@*company-data-covered*/cypress-shared';
import { LoginUser } from '../../fixtures/loginUsers';

const { sendPOSTRequest } = Request;

//TODO: [EP-203] - Move login and users into cypress-shared or equivilant - https://*company-data-covered*.atlassian.net/browse/EP-203
function login({ username, password }: LoginUser) {
  cy.clearLocalStorage();

  const domain = Cypress.env('authUrl');
  const redirect_uri = Cypress.env('authUrl');
  const client_id = Cypress.env('authClientId');
  const audience = Cypress.env('authAudience');
  const scope = 'openid profile email';

  sendPOSTRequest({
    url: `https://${domain}/oauth/token`,
    body: {
      grant_type: 'password',
      username,
      password,
      audience,
      scope,
      client_id,
      redirect_uri,
    },
  }).then((resp) => {
    Cypress.env('token', resp.body.access_token);

    const { access_token, id_token, token_type, expires_in } = resp.body;
    Cypress.env('token', id_token);
    cy.window().then((win) => {
      const payload = JSON.parse(
        Buffer.from(id_token.split('.')[1], 'base64').toString('ascii')
      );
      win.localStorage.setItem(
        `@@auth0spajs@@::${client_id}::${audience}::${scope}`,
        JSON.stringify({
          body: {
            client_id,
            access_token,
            id_token,
            scope,
            expires_in,
            token_type,
            decodedToken: {
              claims: { ...payload, __raw: id_token },
              encoded: {
                header: id_token.split('.')[0],
                payload: id_token.split('.')[1],
                signature: id_token.split('.')[2],
              },
              header: JSON.parse(
                Buffer.from(id_token.split('.')[0], 'base64').toString('ascii')
              ),
              user: {
                email: payload.email,
                email_verified: payload.email_verified,
                given_name: payload.name,
                name: payload.name,
                nickname: payload.nickname,
                picture: payload.picture,
                sub: payload.sub,
                updated_at: payload.updated_at,
              },
            },
            audience,
          },
          expiresAt: Math.floor(Date.now() / 1000) + expires_in,
        })
      );
    });
  });
}

export default login;
