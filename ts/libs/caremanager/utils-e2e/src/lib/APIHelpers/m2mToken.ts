import { sendPOSTRequest } from './request';

export const getCareManagerServiceM2MToken = () => {
  const authDomain = Cypress.env('AUTH0_DOMAIN') || '';
  const clientId = Cypress.env('CAREMANAGER_M2M_CLIENT_ID') || '';
  const clientSecret = Cypress.env('CAREMANAGER_M2M_CLIENT_SECRET') || '';

  const body = {
    audience: 'caremanager-service.*company-data-covered*.com',
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  };

  sendPOSTRequest({
    url: `https://${authDomain}/oauth/token`,
    body,
  }).then((resp) => {
    Cypress.env('CAREMANAGER_M2M_TOKEN', resp.body.access_token);
  });
};
