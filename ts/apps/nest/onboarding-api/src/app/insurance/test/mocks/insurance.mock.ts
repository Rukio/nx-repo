import {
  Insurance,
  InsuranceParams,
  InsuranceEligibility,
  SelfUploadInsurance,
  StationInsurance,
  StationInsuranceParams,
  StationSelfUploadInsurance,
  StationInsuranceEligibility,
} from '@*company-data-covered*/consumer-web-types';
import InsuranceBodyDto from '../../dto/insurance-body.dto';
import InsuranceQueryDto from '../../dto/insurance-query.dto';

export const MOCK_RESULT_ELIGIBILITY: InsuranceEligibility = {
  id: 406432,
  companyName: 'AARP/UHC Medicare Complete',
  ehrId: '1223274',
  ehrName: 'athena',
  eligibilityMessage: null,
  eligible: 'Unverified',
  insuranceClassification: 'medicare-advantage',
  insuranceClassificationId: 3,
  insuredSameAsPatient: true,
  memberId: '1111111111',
  packageId: '58750',
  patientId: 401356,
};

export const MOCK_ELIGIBILITY_RESPONSE: InsuranceEligibility[] = [
  { ...MOCK_RESULT_ELIGIBILITY },
];

export const MOCK_INSURANCE_BODY: InsuranceBodyDto = {
  id: 408265,
  patientId: 407474,
  priority: '1',
  companyName: 'United+Healthcare+Commercial',
  memberId: 5654987,
  groupNumber: '',
  packageId: 982,
  patientRelationToSubscriber: 'patient',
  primaryInsuranceHolder: {
    id: 560585,
    firstName: 'Doe',
    middleInitial: '',
    lastName: 'John',
    gender: 'male',
    patientRelationshipToInsured: 'self',
    insuranceId: '408265',
    createdAt: '2022-02-07T13:43:40.727Z',
    updatedAt: '2022-02-07T13:43:40.727Z',
  },
  primaryInsuranceHolderAttributes: {
    firstName: 'Doe',
    middleInitial: '',
    lastName: 'John',
    gender: 'male',
    patientRelationshipToInsured: 'self',
  },
  cardBack: undefined,
  cardBackUrl: '',
  cardFront: undefined,
  cardFrontUrl:
    'https://uat.*company-data-covered*.com/card_front/default/408265/1644241415-card_front.png',
  city: '',
  copayOfficeVisit: '',
  copaySpecialist: '',
  copayUrgentCare: '',
  createdAt: '2022-02-07T13:43:35.932Z',
  ehrId: 1227047,
  ehrName: 'athena',
  eligibilityMessage: '',
  eligible: '',
  employer: '',
  endDate: '',
  firstName: 'Doe',
  gender: 'male',
  imageRequiresVerification: false,
  insuranceClassification: 'commercial',
  insuranceClassificationId: 2,
  insuredSameAsPatient: true,
  lastName: 'John',
  latitude: '',
  listPhone: '',
  longitude: '',
  middleInitial: '',
  patientRelationshipToInsured: 'self',
  planType: '',
  policyHolderType: '',
  primaryInsuranceHolderToggle: 'patient',
  pulledAt: '2022-02-07T13:43:46.808Z',
  pushedAt: '2022-02-07T13:52:23.501Z',
  removeCardBack: undefined,
  removeCardFront: undefined,
  skipProcessing: true,
  startDate: '',
  state: '',
  streetAddress1: '',
  streetAddress2: '',
  subscriberCity: 'CO',
  subscriberDob: '01/03/2017',
  subscriberFirstName: 'Doe',
  subscriberGender: 'M',
  subscriberLastName: 'John',
  subscriberMiddleInitial: '',
  subscriberPhone: '',
  subscriberState: 'CO',
  subscriberStreetAddress: 'Denver',
  subscriberZipcode: '80205',
  updatedAt: '2022-02-07T13:52:21.332Z',
  webAddress: '',
  zipcode: '',
};

export const MOCK_INSURANCE: Insurance = {
  ...MOCK_INSURANCE_BODY,
  insurancePlanId: 47,
  insurancePlan: {
    id: 47,
    name: 'United+Healthcare+Commercial',
    packageId: 982,
    active: true,
    primary: true,
    secondary: false,
    tertiary: false,
    insurancePlanNetwork: {
      id: 1,
      name: 'United+Healthcare+Commercial',
      notes: 'Commercial insurance',
      packageId: 982,
      active: true,
      insuranceClassificationId: 2,
      insurancePlanId: 42,
      insurancePayerId: 1,
      insurancePayerName: 'United Healthcare',
      eligibilityCheck: false,
      providerEnrollment: false,
      stateAbbrs: ['CO'],
    },
  },
};

export const MOCK_STATION_INSURANCE: StationInsurance = {
  first_name: MOCK_INSURANCE.firstName,
  last_name: MOCK_INSURANCE.lastName,
  middle_initial: MOCK_INSURANCE.middleInitial,
  gender: MOCK_INSURANCE.gender,
  skip_processing: MOCK_INSURANCE.skipProcessing,
  primary_insurance_holder: {
    id: MOCK_INSURANCE.primaryInsuranceHolder.id,
    first_name: MOCK_INSURANCE.primaryInsuranceHolder.firstName,
    last_name: MOCK_INSURANCE.primaryInsuranceHolder.lastName,
    middle_initial: MOCK_INSURANCE.primaryInsuranceHolder.middleInitial,
    gender: MOCK_INSURANCE.primaryInsuranceHolder.gender,
    patient_relationship_to_insured:
      MOCK_INSURANCE.primaryInsuranceHolder.patientRelationshipToInsured,
    insurance_id: MOCK_INSURANCE.primaryInsuranceHolder.insuranceId,
    created_at: MOCK_INSURANCE.primaryInsuranceHolder.createdAt,
    updated_at: MOCK_INSURANCE.primaryInsuranceHolder.updatedAt,
  },
  primary_insurance_holder_attributes: {
    first_name: MOCK_INSURANCE.primaryInsuranceHolderAttributes.firstName,
    last_name: MOCK_INSURANCE.primaryInsuranceHolderAttributes.lastName,
    middle_initial:
      MOCK_INSURANCE.primaryInsuranceHolderAttributes.middleInitial,
    gender: MOCK_INSURANCE.primaryInsuranceHolderAttributes.gender,
    id: MOCK_INSURANCE.primaryInsuranceHolderAttributes.id,
    insurance_id: MOCK_INSURANCE.primaryInsuranceHolderAttributes.insuranceId,
    patient_relationship_to_insured:
      MOCK_INSURANCE.primaryInsuranceHolderAttributes
        .patientRelationshipToInsured,
  },
  primary_insurance_holder_toggle: MOCK_INSURANCE.primaryInsuranceHolderToggle,
  patient_relationship_to_insured: MOCK_INSURANCE.patientRelationshipToInsured,
  id: MOCK_INSURANCE.id,
  insurance_plan_id: MOCK_INSURANCE.insurancePlanId,
  insurance_plan: {
    id: MOCK_INSURANCE.insurancePlan.id,
    name: MOCK_INSURANCE.insurancePlan.name,
    package_id: MOCK_INSURANCE.insurancePlan.packageId,
    active: MOCK_INSURANCE.insurancePlan.active,
    primary: MOCK_INSURANCE.insurancePlan.primary,
    secondary: MOCK_INSURANCE.insurancePlan.secondary,
    tertiary: MOCK_INSURANCE.insurancePlan.tertiary,
    insurance_plan_network: {
      id: MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.id,
      name: MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.name,
      notes: MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.notes,
      package_id: MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.packageId,
      active: MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.active,
      insurance_classification_id:
        MOCK_INSURANCE.insurancePlan.insurancePlanNetwork
          .insuranceClassificationId,
      insurance_plan_id:
        MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.insurancePlanId,
      insurance_payer_id:
        MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.insurancePayerId,
      insurance_payer_name:
        MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.insurancePayerName,
      eligibility_check:
        MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.eligibilityCheck,
      provider_enrollment:
        MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.providerEnrollment,
      state_abbrs: MOCK_INSURANCE.insurancePlan.insurancePlanNetwork.stateAbbrs,
    },
  },
  patient_id: MOCK_INSURANCE.patientId,
  priority: MOCK_INSURANCE.priority,
  start_date: MOCK_INSURANCE.startDate,
  end_date: MOCK_INSURANCE.endDate,
  company_name: MOCK_INSURANCE.companyName,
  member_id: MOCK_INSURANCE.memberId,
  group_number: MOCK_INSURANCE.groupNumber,
  created_at: MOCK_INSURANCE.createdAt,
  updated_at: MOCK_INSURANCE.updatedAt,
  insured_same_as_patient: MOCK_INSURANCE.insuredSameAsPatient,
  patient_relation_to_subscriber: MOCK_INSURANCE.patientRelationToSubscriber,
  copay_office_visit: MOCK_INSURANCE.copayOfficeVisit,
  copay_specialist: MOCK_INSURANCE.copaySpecialist,
  copay_urgent_care: MOCK_INSURANCE.copayUrgentCare,
  plan_type: MOCK_INSURANCE.planType,
  web_address: MOCK_INSURANCE.webAddress,
  list_phone: MOCK_INSURANCE.listPhone,
  subscriber_first_name: MOCK_INSURANCE.subscriberFirstName,
  subscriber_last_name: MOCK_INSURANCE.subscriberLastName,
  subscriber_phone: MOCK_INSURANCE.subscriberPhone,
  subscriber_street_address: MOCK_INSURANCE.subscriberStreetAddress,
  subscriber_city: MOCK_INSURANCE.subscriberCity,
  subscriber_state: MOCK_INSURANCE.subscriberState,
  subscriber_zipcode: MOCK_INSURANCE.subscriberZipcode,
  policy_holder_type: MOCK_INSURANCE.policyHolderType,
  subscriber_dob: MOCK_INSURANCE.subscriberDob,
  subscriber_gender: MOCK_INSURANCE.subscriberGender,
  package_id: MOCK_INSURANCE.packageId,
  employer: MOCK_INSURANCE.employer,
  eligible: MOCK_INSURANCE.eligible,
  ehr_id: MOCK_INSURANCE.ehrId,
  ehr_name: MOCK_INSURANCE.ehrName,
  pulled_at: MOCK_INSURANCE.pulledAt,
  pushed_at: MOCK_INSURANCE.pushedAt,
  remove_card_back: MOCK_INSURANCE.removeCardBack,
  remove_card_front: MOCK_INSURANCE.removeCardFront,
  eligibility_message: MOCK_INSURANCE.eligibilityMessage,
  subscriber_middle_initial: MOCK_INSURANCE.subscriberMiddleInitial,
  image_requires_verification: MOCK_INSURANCE.imageRequiresVerification,
  street_address_1: MOCK_INSURANCE.streetAddress1,
  street_address_2: MOCK_INSURANCE.streetAddress2,
  city: MOCK_INSURANCE.city,
  state: MOCK_INSURANCE.state,
  zipcode: MOCK_INSURANCE.zipcode,
  latitude: MOCK_INSURANCE.latitude,
  longitude: MOCK_INSURANCE.longitude,
  card_back: MOCK_INSURANCE.cardBack,
  card_back_url: MOCK_INSURANCE.cardBackUrl,
  card_front: MOCK_INSURANCE.cardFront,
  card_front_url: MOCK_INSURANCE.cardFrontUrl,
  insurance_classification: MOCK_INSURANCE.insuranceClassification,
  insurance_classification_id: MOCK_INSURANCE.insuranceClassificationId,
};

export const MOCK_INSURANCE_QUERY_DTO: InsuranceQueryDto = {
  patientId: 407474,
  careRequestId: 655821,
  marketId: 159,
};

export const MOCK_INSURANCE_PARAMS: InsuranceParams = {
  priority: '2',
  memberId: 5654987,
  packageId: 982,
  companyName: 'United+Healthcare+Commercial',
  primaryInsuranceHolderToggle: 'patient',
  insuredSameAsPatient: true,
  patientRelationToSubscriber: 'patient',
  patientRelationshipToInsured: 'self',
  firstName: 'John',
  middleInitial: '',
  lastName: 'Doe',
  gender: 'male',
  primaryInsuranceHolderAttributes: {
    firstName: 'Doe',
    middleInitial: '',
    lastName: 'John',
    gender: 'male',
    patientRelationshipToInsured: 'self',
  },
  cardBack: null,
  cardFront: null,
  removeCardBack: null,
  removeCardFront: null,
  skipProcessing: true,
  copayUrgentCare: null,
  policyHolderType: null,
};

export const MOCK_STATION_INSURANCE_PARAMS: StationInsuranceParams = {
  priority: MOCK_INSURANCE_PARAMS.priority,
  member_id: MOCK_INSURANCE_PARAMS.memberId,
  package_id: MOCK_INSURANCE_PARAMS.packageId,
  company_name: MOCK_INSURANCE_PARAMS.companyName,
  primary_insurance_holder_toggle:
    MOCK_INSURANCE_PARAMS.primaryInsuranceHolderToggle,
  insured_same_as_patient: MOCK_INSURANCE_PARAMS.insuredSameAsPatient,
  patient_relation_to_subscriber:
    MOCK_INSURANCE_PARAMS.patientRelationToSubscriber,
  patient_relationship_to_insured:
    MOCK_INSURANCE_PARAMS.patientRelationshipToInsured,
  first_name: MOCK_INSURANCE_PARAMS.firstName,
  middle_initial: MOCK_INSURANCE_PARAMS.middleInitial,
  last_name: MOCK_INSURANCE_PARAMS.lastName,
  gender: MOCK_INSURANCE_PARAMS.gender,
  primary_insurance_holder_attributes: {
    first_name:
      MOCK_INSURANCE_PARAMS.primaryInsuranceHolderAttributes.firstName,
    gender: MOCK_INSURANCE_PARAMS.primaryInsuranceHolderAttributes.gender,
    last_name: MOCK_INSURANCE_PARAMS.primaryInsuranceHolderAttributes.lastName,
    middle_initial:
      MOCK_INSURANCE_PARAMS.primaryInsuranceHolderAttributes.middleInitial,
    patient_relationship_to_insured:
      MOCK_INSURANCE_PARAMS.primaryInsuranceHolderAttributes
        .patientRelationshipToInsured,
  },
  card_back: MOCK_INSURANCE_PARAMS.cardBack,
  card_front: MOCK_INSURANCE_PARAMS.cardFront,
  skip_processing: MOCK_INSURANCE_PARAMS.skipProcessing,
  policy_holder_type: MOCK_INSURANCE_PARAMS.policyHolderType,
};

export const MOCK_ELIGIBILITY_STATION_RESPONSE: StationInsuranceEligibility[] =
  [
    {
      id: 406432,
      company_name: 'AARP/UHC Medicare Complete',
      ehr_id: '1223274',
      ehr_name: 'athena',
      eligibility_message: null,
      eligible: 'Unverified',
      insurance_classification: 'medicare-advantage',
      insurance_classification_id: 3,
      insured_same_as_patient: true,
      member_id: '1111111111',
      package_id: '58750',
      patient_id: 401356,
    },
  ];

export const MOCK_FETCH_INSURANCE_RESPONSE: Insurance[] = [
  {
    ...MOCK_INSURANCE_BODY,
    insurancePlan: MOCK_INSURANCE.insurancePlan,
    insurancePlanId: MOCK_INSURANCE.insurancePlanId,
  },
];

export const MOCK_STATION_FETCH_INSURANCE_RESPONSE = [
  { ...MOCK_STATION_INSURANCE },
];

export const MOCK_RESULT_SELF_UPLOADED_INSURANCE: SelfUploadInsurance = {
  id: 8,
  memberId: 'test_member_id',
  insuranceProvider: null,
  insurancePlan: null,
  selfPay: null,
  selfUploadInsuranceCardFront: {
    url: 'http://localhost:3000/self_upload_insurance_card_front/default/8/1642943179-self_upload_insurance_card_front.png',
    thumb: {
      url: 'http://localhost:3000/self_upload_insurance_card_front/thumb/8/thumb_1642943179-self_upload_insurance_card_front.png',
    },
    small: {
      url: 'http://localhost:3000/self_upload_insurance_card_front/small/8/small_1642943179-self_upload_insurance_card_front.png',
    },
  },
  selfUploadInsuranceCardBack: {
    url: 'http://localhost:3000/self_upload_insurance_card_back/default/8/1642943179-self_upload_insurance_card_back.png',
    thumb: {
      url: 'http://localhost:3000/self_upload_insurance_card_back/thumb/8/thumb_1642943179-self_upload_insurance_card_back.png',
    },
    small: {
      url: 'http://localhost:3000/self_upload_insurance_card_back/small/8/small_1642943179-self_upload_insurance_card_back.png',
    },
  },
  careRequestId: 637526,
  createdAt: '2022-01-23T13:06:19.006Z',
  updatedAt: '2022-01-23T13:06:19.006Z',
};

export const MOCK_STATION_RESULT_SELF_UPLOADED_INSURANCE: StationSelfUploadInsurance =
  {
    id: 8,
    member_id: MOCK_RESULT_SELF_UPLOADED_INSURANCE.memberId,
    insurance_provider: MOCK_RESULT_SELF_UPLOADED_INSURANCE.insuranceProvider,
    insurance_plan: MOCK_RESULT_SELF_UPLOADED_INSURANCE.insurancePlan,
    self_pay: MOCK_RESULT_SELF_UPLOADED_INSURANCE.selfPay,
    self_upload_insurance_card_front: {
      url: MOCK_RESULT_SELF_UPLOADED_INSURANCE.selfUploadInsuranceCardFront.url,
      thumb: {
        url: MOCK_RESULT_SELF_UPLOADED_INSURANCE.selfUploadInsuranceCardFront
          .thumb.url,
      },
      small: {
        url: MOCK_RESULT_SELF_UPLOADED_INSURANCE.selfUploadInsuranceCardFront
          .small.url,
      },
    },
    self_upload_insurance_card_back: {
      url: MOCK_RESULT_SELF_UPLOADED_INSURANCE.selfUploadInsuranceCardBack.url,
      thumb: {
        url: MOCK_RESULT_SELF_UPLOADED_INSURANCE.selfUploadInsuranceCardBack
          .thumb.url,
      },
      small: {
        url: MOCK_RESULT_SELF_UPLOADED_INSURANCE.selfUploadInsuranceCardBack
          .small.url,
      },
    },
    care_request_id: MOCK_RESULT_SELF_UPLOADED_INSURANCE.careRequestId,
    created_at: MOCK_RESULT_SELF_UPLOADED_INSURANCE.createdAt,
    updated_at: MOCK_RESULT_SELF_UPLOADED_INSURANCE.updatedAt,
  };

export const MOCK_EXPECTED_UPDATE_INSURANCE = {
  insurance: {
    ...MOCK_STATION_INSURANCE,
  },
};
