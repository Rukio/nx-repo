module.exports = async () => {
  process.env.ONBOARDING_M2M_CLIENT_ID = 'abc123clientID';
  process.env.ONBOARDING_M2M_CLIENT_SECRET = 'def456clientSecret';
  process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test.us.auth0.com';
  process.env.AUTH0_ISSUER_URL = 'https://testing-auth.*company-data-covered*.com/';
  process.env.M2M_STATION_AUDIENCE = 'internal.*company-data-covered*.com';
  process.env.M2M_INSURANCE_SERVICE_AUDIENCE = 'internal.*company-data-covered*.com';
  process.env.M2M_PATIENT_SERVICE_AUDIENCE = 'internal.*company-data-covered*.com';
  process.env.M2M_RISK_STRAT_SERVICE_AUDIENCE = 'internal.*company-data-covered*.com';
  process.env.ONBOARDING_REDIS_URL = 'redis://localhost:6380';
  process.env.POLICY_SERVICE_BASE_URL = 'http://localhost:8181';
};
