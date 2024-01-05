import {
  EhrInsurancePlan,
  EhrStationInsurancePlan,
  InsurancePlan,
  StationInsurancePlan,
  EhrInsurancePlanParams,
  EhrStationInsurancePlanParams,
} from '@*company-data-covered*/consumer-web-types';

const StationInsurancePlanToInsurancePlan = (
  input: StationInsurancePlan
): InsurancePlan => {
  const output: InsurancePlan = {
    id: input.id,
    name: input.name,
    packageId: input.package_id,
    note: input.note,
    active: input.active,
    primary: input.primary,
    secondary: input.secondary,
    tertiary: input.tertiary,
    stateId: input.state_id,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    planType: input.plan_type,
    insuranceClassificationId: input.insurance_classification_id,
    bypassScrubbing: input.bypass_scrubbing,
    alwaysScrubbing: input.always_scrubbing,
    erDiversion: input.er_diversion,
    nineOneOneDiversion: input.nine_one_one_diversion,
    observationDiversion: input.observation_diversion,
    hospitalizationDiversion: input.hospitalization_diversion,
    contracted: input.contracted,
    payerGroupId: input.payer_group_id,
    insuranceClassificationName: input.insurance_classification_name,
    billingCityInsurancePlans: input.billing_city_insurance_plans.map((bc) => ({
      id: bc.id,
      insurancePlanId: bc.insurance_plan_id,
      billingCityId: bc.billing_city_id,
      enabled: bc.enabled,
      note: bc.note,
      advancedCareEligibility: bc.advanced_care_eligibility,
      createdAt: bc.created_at,
      updatedAt: bc.updated_at,
    })),
    insurancePlanServiceLines: input.insurance_plan_service_lines.map((ip) => ({
      id: ip.id,
      serviceLineId: ip.service_line_id,
      insurancePlanId: ip.insurance_plan_id,
      scheduleNow: ip.schedule_now,
      scheduleFuture: ip.schedule_future,
      captureCcOnScene: ip.capture_cc_on_scene,
      note: ip.note,
      createdAt: ip.created_at,
      updatedAt: ip.updated_at,
      allChannelItems: ip.all_channel_items,
      enabled: ip.enabled,
      newPatientAppointmentType: ip.new_patient_appointment_type,
      existingPatientAppointmentType: ip.existing_patient_appointment_type,
      onboardingCcPolicy: ip.onboarding_cc_policy,
    })),
    insuranceClassification: {
      id: input.insurance_classification?.id,
      name: input.insurance_classification?.name,
      createdAt: input.insurance_classification?.created_at,
      updatedAt: input.insurance_classification?.updated_at,
    },
  };

  return output;
};

const EhrinsurancePlanParamToEhrStationInsurancePlanParam = (
  params: EhrInsurancePlanParams
): EhrStationInsurancePlanParams => ({
  insurance_name: params.name,
  member_id: params.memberId,
  check_case_policies: params.checkCasePolicies || false,
});

const EhrStationinsurancePlanToEhrInsurancePlan = (
  input: EhrStationInsurancePlan
): EhrInsurancePlan => ({
  affiliations: input.affiliations,
  planName: input.insuranceplanname,
  packageId: input.insurancepackageid,
  addressList: input.addresslist,
});

export default {
  StationInsurancePlanToInsurancePlan,
  EhrinsurancePlanParamToEhrStationInsurancePlanParam,
  EhrStationinsurancePlanToEhrInsurancePlan,
};
