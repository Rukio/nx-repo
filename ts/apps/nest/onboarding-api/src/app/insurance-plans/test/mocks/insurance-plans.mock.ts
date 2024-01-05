import {
  EhrInsurancePlan,
  InsurancePlan,
  StationInsurancePlan,
  EhrStationInsurancePlan,
} from '@*company-data-covered*/consumer-web-types';
import EhrInsurancePlanQueryDto from '../../dto/ehr-insurance-plans-query.dto';

export const MOCK_INSURANCE_PLAN_RESPONSE: InsurancePlan = {
  id: 20,
  name: 'AARP Medicare Supplement',
  packageId: '1910',
  note: '',
  active: true,
  primary: false,
  secondary: true,
  tertiary: true,
  stateId: 6,
  createdAt: '2017-07-20T12:21:42.635Z',
  updatedAt: '2021-12-10T18:38:01.578Z',
  planType: 'insurance_plan',
  insuranceClassificationId: 7,
  bypassScrubbing: false,
  alwaysScrubbing: false,
  erDiversion: null,
  nineOneOneDiversion: null,
  observationDiversion: null,
  hospitalizationDiversion: null,
  contracted: false,
  payerGroupId: null,
  insuranceClassificationName: 'medicare-supplement',
  billingCityInsurancePlans: [
    {
      id: 270,
      insurancePlanId: 20,
      billingCityId: 5,
      enabled: true,
      note: '',
      advancedCareEligibility: true,
      createdAt: '2020-08-03T05:07:45.421Z',
      updatedAt: '2021-06-15T16:42:13.870Z',
    },
  ],
  insurancePlanServiceLines: [
    {
      id: 39,
      serviceLineId: 1,
      insurancePlanId: 20,
      scheduleNow: true,
      scheduleFuture: true,
      captureCcOnScene: true,
      note: 'This is a medicare supplement plan designed to cover what medicare does not.  A deductible and coinsurance may still apply.  This must be accompanied by valid Medicare Part B insurance.',
      createdAt: '2019-03-28T05:33:56.381Z',
      updatedAt: '2020-11-20T05:23:34.373Z',
      allChannelItems: true,
      enabled: true,
      onboardingCcPolicy: 'OPTIONAL',
    },
  ],
  insuranceClassification: {
    id: 7,
    name: 'Medicare Supplement',
    createdAt: '2018-04-18T15:19:22.776Z',
    updatedAt: '2018-04-18T15:19:22.776Z',
  },
};

export const MOCK_EHR_INSURANCE_RESPONSE: EhrInsurancePlan = {
  affiliations: ['Family Planning', 'QMB'],
  planName: 'Medicaid-CT',
  packageId: '2232',
  addressList: [
    'PO BOX 2941  HARTFORD CT 06104-2941',
    'PO BOX 2911  HARTFORD CT 06104-2911',
    'PO BOX 2991  HARTFORD CT 06104-2991',
    'PO BOX 2942  HARTFORD CT 06104-2942',
  ],
};

export const MOCK_EHR_INSURANCE_QUERY: EhrInsurancePlanQueryDto = {
  name: 'medic',
  memberId: 12345,
  checkCasePolicies: false,
};

export const MOCK_STATION_INSURANCE_PLAN_RESPONSE: StationInsurancePlan = {
  id: 20,
  name: 'AARP Medicare Supplement',
  package_id: '1910',
  note: '',
  active: true,
  primary: false,
  secondary: true,
  tertiary: true,
  state_id: 6,
  created_at: '2017-07-20T12:21:42.635Z',
  updated_at: '2021-12-10T18:38:01.578Z',
  plan_type: 'insurance_plan',
  insurance_classification_id: 7,
  bypass_scrubbing: false,
  always_scrubbing: false,
  er_diversion: null,
  nine_one_one_diversion: null,
  observation_diversion: null,
  hospitalization_diversion: null,
  contracted: false,
  payer_group_id: null,
  insurance_classification_name: 'medicare-supplement',
  billing_city_insurance_plans: [
    {
      id: 270,
      insurance_plan_id: 20,
      billing_city_id: 5,
      enabled: true,
      note: '',
      advanced_care_eligibility: true,
      created_at: '2020-08-03T05:07:45.421Z',
      updated_at: '2021-06-15T16:42:13.870Z',
    },
  ],
  insurance_plan_service_lines: [
    {
      id: 39,
      service_line_id: 1,
      insurance_plan_id: 20,
      schedule_now: true,
      schedule_future: true,
      capture_cc_on_scene: true,
      note: 'This is a medicare supplement plan designed to cover what medicare does not.  A deductible and coinsurance may still apply.  This must be accompanied by valid Medicare Part B insurance.',
      created_at: '2019-03-28T05:33:56.381Z',
      updated_at: '2020-11-20T05:23:34.373Z',
      all_channel_items: true,
      enabled: true,
      onboarding_cc_policy: 'OPTIONAL',
    },
  ],
  insurance_classification: {
    id: 7,
    name: 'Medicare Supplement',
    created_at: '2018-04-18T15:19:22.776Z',
    updated_at: '2018-04-18T15:19:22.776Z',
  },
};
export const MOCK_STATION_EHR_INSURANCE_RESPONSE: EhrStationInsurancePlan = {
  affiliations: ['Family Planning', 'QMB'],
  insuranceplanname: 'Medicaid-CT',
  insurancepackageid: '2232',
  addresslist: [
    'PO BOX 2941  HARTFORD CT 06104-2941',
    'PO BOX 2911  HARTFORD CT 06104-2911',
    'PO BOX 2991  HARTFORD CT 06104-2991',
    'PO BOX 2942  HARTFORD CT 06104-2942',
  ],
};