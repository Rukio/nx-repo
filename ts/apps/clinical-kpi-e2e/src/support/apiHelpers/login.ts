/* eslint-disable @typescript-eslint/naming-convention */
import { Request } from '@*company-data-covered*/cypress-shared';
import { UserPasswordConfig } from '../../../cypress.config';
import { LoginUser, type UserKey } from '../../fixtures/loginUsers';

const { sendPOSTRequest } = Request;

const STATION_URL = Cypress.env('stationUrl');
const CLINICAL_KPI_URL = Cypress.env('baseUrl');

function login({ username }: LoginUser, userType: UserKey) {
  const authUrl = Cypress.env('authUrl');
  const clientId = Cypress.env('authClientId');
  const stationClientId = Cypress.env('authStationClientId');
  const audience = Cypress.env('authAudience');
  const scope = 'openid profile email';
  const passwords = Cypress.env('userPasswords') as UserPasswordConfig;
  const password = passwords[userType];

  sendPOSTRequest({
    url: authUrl,
    body: {
      grant_type: 'password',
      username,
      password,
      audience,
      scope,
      client_id: clientId,
    },
  })
    .then((resp) => {
      Cypress.env('token', resp.body.id_token);

      const { access_token, id_token, token_type, expires_in } = resp.body;
      cy.window().then((win) => {
        const payload = JSON.parse(
          Buffer.from(id_token.split('.')[1], 'base64').toString('ascii')
        );
        win.localStorage.setItem(
          `@@auth0spajs@@::${clientId}::${audience}::${scope}`,
          JSON.stringify({
            body: {
              client_id: clientId,
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
    })
    .then(() => {
      // Login to Dashboard
      Cypress.config('baseUrl', STATION_URL);
      sendPOSTRequest({
        url: authUrl,
        body: {
          grant_type: 'password',
          username,
          password,
          audience,
          scope,
          client_id: stationClientId,
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
        }).then(() => {
          Cypress.config('baseUrl', CLINICAL_KPI_URL);
        });
      });
    });
}

export default login;
