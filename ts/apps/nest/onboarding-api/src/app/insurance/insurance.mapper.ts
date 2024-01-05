import {
  Insurance,
  InsuranceParams,
  StationInsurance,
  StationInsuranceParams,
  InsuranceEligibility,
  StationInsuranceEligibility,
  StationSelfUploadInsurance,
  SelfUploadInsurance,
} from '@*company-data-covered*/consumer-web-types';

const StationInsuranceToInsurance = (input: StationInsurance): Insurance => {
  const {
    primary_insurance_holder,
    primary_insurance_holder_attributes,
    insurance_plan,
    ...insuranceAttributes
  } = input;

  const output: Insurance = {
    id: insuranceAttributes.id,
    patientId: insuranceAttributes.patient_id,
    priority: insuranceAttributes.priority,
    companyName: insurance_plan?.name || insuranceAttributes.company_name,
    insurancePlanId: insuranceAttributes.insurance_plan_id,
    memberId: insuranceAttributes.member_id,
    groupNumber: insuranceAttributes.group_number,
    packageId: insurance_plan?.package_id || insuranceAttributes.package_id,
    patientRelationToSubscriber:
      insuranceAttributes.patient_relation_to_subscriber,
    primaryInsuranceHolder: primary_insurance_holder && {
      id: primary_insurance_holder.id,
      firstName: primary_insurance_holder.first_name,
      middleInitial: primary_insurance_holder.middle_initial,
      lastName: primary_insurance_holder.last_name,
      gender: primary_insurance_holder.gender,
      patientRelationshipToInsured:
        primary_insurance_holder.patient_relationship_to_insured,
      insuranceId: primary_insurance_holder.insurance_id,
      createdAt: primary_insurance_holder.created_at,
      updatedAt: primary_insurance_holder.updated_at,
    },
    primaryInsuranceHolderAttributes: primary_insurance_holder_attributes && {
      firstName: primary_insurance_holder_attributes.first_name,
      middleInitial: primary_insurance_holder_attributes.middle_initial,
      lastName: primary_insurance_holder_attributes.last_name,
      gender: primary_insurance_holder_attributes.gender,
      patientRelationshipToInsured:
        primary_insurance_holder_attributes.patient_relationship_to_insured,
    },
    cardBack: insuranceAttributes.card_back,
    cardBackUrl: insuranceAttributes.card_back_url,
    cardFront: insuranceAttributes.card_front,
    cardFrontUrl: insuranceAttributes.card_front_url,
    city: insuranceAttributes.city,
    copayOfficeVisit: insuranceAttributes.copay_office_visit,
    copaySpecialist: insuranceAttributes.copay_specialist,
    copayUrgentCare: insuranceAttributes.copay_urgent_care,
    createdAt: insuranceAttributes.created_at,
    ehrId: insuranceAttributes.ehr_id,
    ehrName: insuranceAttributes.ehr_name,
    eligibilityMessage: insuranceAttributes.eligibility_message,
    eligible: insuranceAttributes.eligible,
    employer: insuranceAttributes.employer,
    endDate: insuranceAttributes.end_date,
    firstName: insuranceAttributes.first_name,
    gender: insuranceAttributes.gender,
    imageRequiresVerification: insuranceAttributes.image_requires_verification,
    insuranceClassification: insuranceAttributes.insurance_classification,
    insuranceClassificationId: insuranceAttributes.insurance_classification_id,
    insuredSameAsPatient: insuranceAttributes.insured_same_as_patient,
    lastName: insuranceAttributes.last_name,
    latitude: insuranceAttributes.latitude,
    listPhone: insuranceAttributes.list_phone,
    longitude: insuranceAttributes.longitude,
    middleInitial: insuranceAttributes.middle_initial,
    patientRelationshipToInsured:
      insuranceAttributes.patient_relationship_to_insured,
    planType: insuranceAttributes.plan_type,
    policyHolderType: insuranceAttributes.policy_holder_type,
    primaryInsuranceHolderToggle:
      insuranceAttributes.primary_insurance_holder_toggle,
    pulledAt: insuranceAttributes.pulled_at,
    pushedAt: insuranceAttributes.pushed_at,
    removeCardBack: insuranceAttributes.remove_card_back,
    removeCardFront: insuranceAttributes.remove_card_front,
    skipProcessing: insuranceAttributes.skip_processing,
    startDate: insuranceAttributes.start_date,
    state: insuranceAttributes.state,
    streetAddress1: insuranceAttributes.street_address_1,
    streetAddress2: insuranceAttributes.street_address_2,
    subscriberCity: insuranceAttributes.subscriber_city,
    subscriberDob: insuranceAttributes.subscriber_dob,
    subscriberFirstName: insuranceAttributes.subscriber_first_name,
    subscriberGender: insuranceAttributes.subscriber_gender,
    subscriberLastName: insuranceAttributes.subscriber_last_name,
    subscriberMiddleInitial: insuranceAttributes.subscriber_middle_initial,
    subscriberPhone: insuranceAttributes.subscriber_phone,
    subscriberState: insuranceAttributes.subscriber_state,
    subscriberStreetAddress: insuranceAttributes.subscriber_street_address,
    subscriberZipcode: insuranceAttributes.subscriber_zipcode,
    updatedAt: insuranceAttributes.updated_at,
    webAddress: insuranceAttributes.web_address,
    zipcode: insuranceAttributes.zipcode,
    insurancePlan: insurance_plan && {
      id: insurance_plan.id,
      name: insurance_plan.name,
      packageId: insurance_plan.package_id,
      active: insurance_plan.active,
      primary: insurance_plan.primary,
      secondary: insurance_plan.secondary,
      tertiary: insurance_plan.tertiary,
      insurancePlanNetwork: insurance_plan.insurance_plan_network && {
        id: insurance_plan.insurance_plan_network.id,
        name: insurance_plan.insurance_plan_network.name,
        notes: insurance_plan.insurance_plan_network.notes,
        packageId: insurance_plan.insurance_plan_network.package_id,
        active: insurance_plan.insurance_plan_network.active,
        insuranceClassificationId:
          insurance_plan.insurance_plan_network.insurance_classification_id,
        insurancePlanId:
          insurance_plan.insurance_plan_network.insurance_plan_id,
        insurancePayerId:
          insurance_plan.insurance_plan_network.insurance_payer_id,
        insurancePayerName:
          insurance_plan.insurance_plan_network.insurance_payer_name,
        eligibilityCheck:
          insurance_plan.insurance_plan_network.eligibility_check,
        providerEnrollment:
          insurance_plan.insurance_plan_network.provider_enrollment,
        stateAbbrs: insurance_plan.insurance_plan_network.state_abbrs,
      },
    },
  };

  return output;
};

const InsuranceToStationInsurance = (input: Insurance): StationInsurance => {
  const {
    primaryInsuranceHolder,
    primaryInsuranceHolderAttributes,
    insurancePlan,
    ...insuranceAttributes
  } = input;

  const output: StationInsurance = {
    card_back: insuranceAttributes.cardBack,
    card_back_url: insuranceAttributes.cardBackUrl,
    card_front: insuranceAttributes.cardFront,
    card_front_url: insuranceAttributes.cardFrontUrl,
    city: insuranceAttributes.city,
    company_name: insuranceAttributes.companyName,
    copay_office_visit: insuranceAttributes.copayOfficeVisit,
    copay_specialist: insuranceAttributes.copaySpecialist,
    copay_urgent_care: insuranceAttributes.copayUrgentCare,
    created_at: insuranceAttributes.createdAt,
    ehr_id: insuranceAttributes.ehrId,
    ehr_name: insuranceAttributes.ehrName,
    eligibility_message: insuranceAttributes.eligibilityMessage,
    eligible: insuranceAttributes.eligible,
    employer: insuranceAttributes.employer,
    end_date: insuranceAttributes.endDate,
    first_name: insuranceAttributes.firstName,
    gender: insuranceAttributes.gender,
    group_number: insuranceAttributes.groupNumber,
    id: insuranceAttributes.id,
    image_requires_verification: insuranceAttributes.imageRequiresVerification,
    insurance_classification: insuranceAttributes.insuranceClassification,
    insurance_classification_id: insuranceAttributes.insuranceClassificationId,
    insured_same_as_patient: insuranceAttributes.insuredSameAsPatient,
    last_name: insuranceAttributes.lastName,
    latitude: insuranceAttributes.latitude,
    list_phone: insuranceAttributes.listPhone,
    longitude: insuranceAttributes.longitude,
    member_id: insuranceAttributes.memberId,
    middle_initial: insuranceAttributes.middleInitial,
    package_id: insuranceAttributes.packageId,
    insurance_plan_id: insuranceAttributes.insurancePlanId,
    insurance_plan: insurancePlan && {
      id: insurancePlan.id,
      name: insurancePlan.name,
      package_id: insurancePlan.packageId,
      active: insurancePlan.active,
      primary: insurancePlan.primary,
      secondary: insurancePlan.secondary,
      tertiary: insurancePlan.tertiary,
      insurance_plan_network: insurancePlan.insurancePlanNetwork && {
        id: insurancePlan.insurancePlanNetwork.id,
        name: insurancePlan.insurancePlanNetwork.name,
        notes: insurancePlan.insurancePlanNetwork.notes,
        package_id: insurancePlan.insurancePlanNetwork.packageId,
        active: insurancePlan.insurancePlanNetwork.active,
        insurance_classification_id:
          insurancePlan.insurancePlanNetwork.insuranceClassificationId,
        insurance_plan_id: insurancePlan.insurancePlanNetwork.insurancePlanId,
        insurance_payer_id: insurancePlan.insurancePlanNetwork.insurancePayerId,
        insurance_payer_name:
          insurancePlan.insurancePlanNetwork.insurancePayerName,
        eligibility_check: insurancePlan.insurancePlanNetwork.eligibilityCheck,
        provider_enrollment:
          insurancePlan.insurancePlanNetwork.providerEnrollment,
        state_abbrs: insurancePlan.insurancePlanNetwork.stateAbbrs,
      },
    },
    patient_id: insuranceAttributes.patientId,
    patient_relation_to_subscriber:
      insuranceAttributes.patientRelationToSubscriber,
    patient_relationship_to_insured:
      insuranceAttributes.patientRelationshipToInsured,
    plan_type: insuranceAttributes.planType,
    policy_holder_type: insuranceAttributes.policyHolderType,
    primary_insurance_holder: primaryInsuranceHolder && {
      id: primaryInsuranceHolder.id,
      insurance_id: primaryInsuranceHolder.insuranceId,
      gender: primaryInsuranceHolder.gender,
      middle_initial: primaryInsuranceHolder.middleInitial,
      patient_relationship_to_insured:
        primaryInsuranceHolder.patientRelationshipToInsured,
      first_name: primaryInsuranceHolder.firstName,
      last_name: primaryInsuranceHolder.lastName,
      created_at: primaryInsuranceHolder.createdAt,
      updated_at: primaryInsuranceHolder.updatedAt,
    },
    primary_insurance_holder_attributes: primaryInsuranceHolderAttributes && {
      id: primaryInsuranceHolderAttributes.id,
      insurance_id: primaryInsuranceHolderAttributes.id,
      gender: primaryInsuranceHolderAttributes.gender,
      middle_initial: primaryInsuranceHolderAttributes.middleInitial,
      patient_relationship_to_insured:
        primaryInsuranceHolderAttributes.patientRelationshipToInsured,
      first_name: primaryInsuranceHolderAttributes.firstName,
      last_name: primaryInsuranceHolderAttributes.lastName,
    },
    primary_insurance_holder_toggle:
      insuranceAttributes.primaryInsuranceHolderToggle,
    priority: insuranceAttributes.priority,
    pulled_at: insuranceAttributes.pulledAt,
    pushed_at: insuranceAttributes.pushedAt,
    remove_card_back: insuranceAttributes.removeCardBack,
    remove_card_front: insuranceAttributes.removeCardFront,
    skip_processing: insuranceAttributes.skipProcessing,
    start_date: insuranceAttributes.startDate,
    state: insuranceAttributes.state,
    street_address_1: insuranceAttributes.streetAddress1,
    street_address_2: insuranceAttributes.streetAddress2,
    subscriber_city: insuranceAttributes.subscriberCity,
    subscriber_dob: insuranceAttributes.subscriberDob,
    subscriber_first_name: insuranceAttributes.subscriberFirstName,
    subscriber_gender: insuranceAttributes.subscriberGender,
    subscriber_last_name: insuranceAttributes.subscriberLastName,
    subscriber_middle_initial: insuranceAttributes.subscriberMiddleInitial,
    subscriber_phone: insuranceAttributes.subscriberPhone,
    subscriber_state: insuranceAttributes.subscriberState,
    subscriber_street_address: insuranceAttributes.subscriberStreetAddress,
    subscriber_zipcode: insuranceAttributes.subscriberZipcode,
    updated_at: insuranceAttributes.updatedAt,
    web_address: insuranceAttributes.webAddress,
    zipcode: insuranceAttributes.zipcode,
  };

  return output;
};

const InsuranceParamsToStationInsuranceParams = (
  input: InsuranceParams
): StationInsuranceParams => {
  const output: StationInsuranceParams = {
    card_back: input.cardBack,
    card_front: input.cardFront,
    company_name: input.companyName,
    first_name: input.firstName,
    gender: input.gender,
    insured_same_as_patient: input.insuredSameAsPatient,
    last_name: input.lastName,
    member_id: input.memberId,
    middle_initial: input.middleInitial,
    package_id: input.packageId,
    insurance_plan_id: input.insurancePlanId,
    patient_relation_to_subscriber: input.patientRelationToSubscriber,
    patient_relationship_to_insured: input.patientRelationshipToInsured,
    policy_holder_type: input.policyHolderType,
    primary_insurance_holder_attributes:
      input.primaryInsuranceHolderAttributes && {
        first_name: input.primaryInsuranceHolderAttributes.firstName,
        gender: input.primaryInsuranceHolderAttributes.gender,
        middle_initial: input.primaryInsuranceHolderAttributes.middleInitial,
        last_name: input.primaryInsuranceHolderAttributes.lastName,
        patient_relationship_to_insured:
          input.primaryInsuranceHolderAttributes.patientRelationshipToInsured,
      },
    primary_insurance_holder_toggle: input.primaryInsuranceHolderToggle,
    priority: input.priority,
    skip_processing: input.skipProcessing,
  };

  return output;
};

const StationInsuranceEligibilityToInsuranceEligibility = (
  input: StationInsuranceEligibility
): InsuranceEligibility => {
  const output: InsuranceEligibility = {
    id: input.id,
    companyName: input.company_name,
    ehrId: input.ehr_id,
    ehrName: input.ehr_name,
    eligibilityMessage: input.eligibility_message,
    eligible: input.eligible,
    insuranceClassification: input.insurance_classification,
    insuranceClassificationId: input.insurance_classification_id,
    insuredSameAsPatient: input.insured_same_as_patient,
    memberId: input.member_id,
    packageId: input.package_id,
    patientId: input.patient_id,
  };

  return output;
};

const StationSelfUploadInsuranceToSelfUploadInsurance = (
  input: StationSelfUploadInsurance
): SelfUploadInsurance => {
  const output: SelfUploadInsurance = {
    id: input.id,
    memberId: input.member_id,
    insuranceProvider: input.insurance_provider,
    insurancePlan: input.insurance_plan,
    selfPay: input.self_pay,
    selfUploadInsuranceCardFront: input.self_upload_insurance_card_front,
    selfUploadInsuranceCardBack: input.self_upload_insurance_card_back,
    careRequestId: input.care_request_id,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };

  return output;
};

export default {
  InsuranceToStationInsurance,
  StationInsuranceToInsurance,
  InsuranceParamsToStationInsuranceParams,
  StationInsuranceEligibilityToInsuranceEligibility,
  StationSelfUploadInsuranceToSelfUploadInsurance,
};
