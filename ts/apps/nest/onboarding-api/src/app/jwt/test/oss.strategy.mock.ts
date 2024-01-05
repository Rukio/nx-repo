export const OssStrategyPayloadMock = {
  'https://*company-data-covered*.com/type': 'user',
  'https://*company-data-covered*.com/props': {
    email: 'testa@*company-data-covered*.com',
    identity_provider_user_id: 'email|test',
  },
  iss: 'https://dev-patients-auth.*company-data-covered*.com/',
  sub: 'email|test',
  aud: [
    'patients.*company-data-covered*.com',
    'https://dispatch-patients-development.us.auth0.com/userinfo',
  ],
  iat: 1689333433,
  exp: 1689419833,
  azp: 'fddddddddddddd',
  scope: 'openid profile email',
};
