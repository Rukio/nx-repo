import { Auth0ConfigurationSettings } from '@*company-data-covered*/nest/auth';

enum VariablesConfigText {
  PatientsAudienceKey = 'M2M_PATIENT_SERVICE_AUDIENCE',
  PatientsTokenKey = 'PATIENT_SERVICE',
  RiskStratificationAudienceKey = 'M2M_RISK_STRAT_SERVICE_AUDIENCE',
  RiskStratificationTokenKey = 'RISK_STRAT_SERVICE',
  InsuranceServiceAudienceKey = 'M2M_INSURANCE_SERVICE_AUDIENCE',
  InsuranceServiceTokenKey = 'INSURANCE_SERVICE',
  StationAudienceKey = 'M2M_STATION_AUDIENCE',
  StationTokenKey = 'STATION',
}

export const ONBOARDING_AUTH_CONFIG_SETTINGS: Pick<
  Auth0ConfigurationSettings,
  'domainKey' | 'clientIdKey' | 'clientSecretKey' | 'issuerKey'
> = {
  domainKey: 'ONBOARDING_M2M_AUTH0_DOMAIN',
  clientIdKey: 'ONBOARDING_M2M_CLIENT_ID',
  clientSecretKey: 'ONBOARDING_M2M_CLIENT_SECRET',
  issuerKey: 'AUTH0_ISSUER_URL',
};

export default VariablesConfigText;
