import { sendPOSTRequest } from './request';

function login(username: string, password: string) {
  try {
    const client_id = Cypress.env('AUTH0_CLIENT_ID') || '';
    const audience = Cypress.env('AUTH0_AUDIENCE') || '';
    const domain = Cypress.env('AUTH0_DOMAIN') || '';
    const scope = 'openid profile email';
    const redirect_uri = Cypress.env('AUTH0_REDIRECT_URI');

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
                  Buffer.from(id_token.split('.')[0], 'base64').toString(
                    'ascii'
                  )
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching oauth token', err);
  }
}

function dashboardLogin(username: string, password: string) {
  const domain = Cypress.env('AUTH0_DASHBOARD_DOMAIN') || '';

  sendPOSTRequest({
    url: `https://${domain}/oauth/token`,
    body: {
      grant_type: 'password',
      username,
      password,
      audience: Cypress.env('AUTH0_AUDIENCE'),
      scope: 'openid profile email',
      client_id: Cypress.env('AUTH0_CLIENT_ID'),
      client_secret: Cypress.env('AUTH0_CLIENT_SECRET'),
    },
  }).then((resp) => {
    const { access_token, id_token, expires_in } = resp.body;

    return sendPOSTRequest({
      url: '/rover_sessions',
      body: {
        credentials: {
          id_token,
          expires_at: expires_in,
          access_token,
        },
      },
    });
  });
}

function onboardingLogin(username: string, password: string) {
  cy.clearLocalStorage();

  const domain = Cypress.env('AUTH0_DASHBOARD_DOMAIN');
  const client_id = Cypress.env('AUTH0_ONBOARDING_CLIENT_ID');
  const audience = Cypress.env('AUTH0_ONBOARDING_AUDIENCE');
  const scope = 'openid profile email';
  const redirect_uri = Cypress.env('AUTH0_ONBOARDING_URL');

  sendPOSTRequest({
    url: `https://${domain}/oauth/token`,
    body: {
      grant_type: 'password',
      redirect_uri,
      username,
      password,
      audience,
      scope,
      client_id,
    },
  }).then((resp) => {
    Cypress.env('onboardingToken', resp.body.id_token);

    const { access_token, id_token, token_type, expires_in } = resp.body;
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
export { dashboardLogin, login, onboardingLogin };
