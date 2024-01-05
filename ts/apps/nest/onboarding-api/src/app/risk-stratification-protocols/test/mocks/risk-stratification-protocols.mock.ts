import {
  RiskStratificationProtocol,
  RiskStratificationProtocolSearchParam,
  StationRiskStratificationProtocol,
} from '@*company-data-covered*/consumer-web-types';

export const RISK_STRATIFICATION_PROTOCOL_QUERY_MOCK: RiskStratificationProtocolSearchParam =
  {
    dob: '2000-01-01',
    gender: 'male',
    serviceLineId: 1,
    keywords: 'face hurts',
    marketId: 159,
  };

export const RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK: RiskStratificationProtocol =
  {
    key: '2000-01-01-male-face hurts-1-15',
    protocols: [
      {
        dob: '2000-01-01',
        gender: 'male',
        general: false,
        highRisk: false,
        id: 97,
        name: 'Weakness',
        weight: 1,
      },
      {
        dob: '2000-01-01',
        gender: 'male',
        general: false,
        highRisk: false,
        id: 96,
        name: 'Headache',
        weight: 1,
      },
      {
        dob: '2000-01-01',
        gender: 'male',
        general: true,
        highRisk: false,
        id: 19,
        name: 'General Complaint',
        weight: 0,
      },
    ],
  };

export const STATION_RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK: StationRiskStratificationProtocol =
  {
    key: '2000-01-01-male-face hurts-1-15',
    protocols: [
      {
        dob: '2000-01-01',
        gender: 'male',
        general: false,
        high_risk: false,
        id: 97,
        name: 'Weakness',
        weight: 1,
      },
      {
        dob: '2000-01-01',
        gender: 'male',
        general: false,
        high_risk: false,
        id: 96,
        name: 'Headache',
        weight: 1,
      },
      {
        dob: '2000-01-01',
        gender: 'male',
        general: true,
        high_risk: false,
        id: 19,
        name: 'General Complaint',
        weight: 0,
      },
    ],
  };
