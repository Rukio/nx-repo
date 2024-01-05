import {
  DashboardInsurance,
  PrimaryInsuranceHolder,
} from '../types/dashboard-insurance';
import { UploadedImageLocations } from '../types/upload-image-location';
import { buildMockUploadedImage } from './../mocks/uploaded-image.mock';
import * as faker from 'faker';

const cardImageUrls: UploadedImageLocations = buildMockUploadedImage();

const primaryInsuranceHolder: PrimaryInsuranceHolder = {
  id: faker.datatype.number(),
  first_name: faker.name.firstName(),
  last_name: faker.name.lastName(),
  middle_initial: faker.random.alpha(),
  gender: faker.random.arrayElement(['male', 'femail']),
  patient_relationship_to_insured: 'patient',
  insurance_id: faker.datatype.number(),
  created_at: faker.datatype.datetime().toString(),
  updated_at: faker.datatype.datetime().toString(),
};

export function buildMockDashboardInsurance(
  userDefinedValues: Partial<DashboardInsurance> = {}
): DashboardInsurance {
  const insurance: DashboardInsurance = {
    id: faker.datatype.number(),
    patient_id: faker.datatype.number(),
    priority: '1',
    start_date: faker.date.past().toString(),
    end_date: faker.date.future().toString(),
    company_name: faker.company.companyName(),
    member_id: faker.datatype.number().toString(),
    group_number: faker.datatype.number().toString(),
    created_at: faker.datatype.datetime().toString(),
    updated_at: faker.datatype.datetime().toString(),
    insured_same_as_patient: true,
    patient_relation_to_subscriber: 'patient',
    copay_office_visit: null,
    copay_specialist: null,
    copay_urgent_care: null,
    plan_type: null,
    web_address: null,
    list_phone: null,
    subscriber_first_name: null,
    subscriber_last_name: null,
    subscriber_phone: null,
    subscriber_street_address: null,
    subscriber_city: null,
    subscriber_state: null,
    subscriber_zipcode: null,
    policy_holder_type: null,
    subscriber_dob: null,
    subscriber_gender: null,
    package_id: faker.datatype.number().toString(),
    employer: faker.company.companyName(),
    eligible: 'Verified',
    ehr_id: faker.datatype.number().toString(),
    ehr_name: faker.company.companyName(),
    pulled_at: faker.date.recent().toString(),
    pushed_at: faker.date.past().toString(),
    eligibility_message: null,
    subscriber_middle_initial: null,
    image_requires_verification: null,
    street_address_1: faker.address.streetAddress(),
    street_address_2: null,
    city: faker.address.city(),
    state: faker.address.state(),
    zipcode: faker.address.zipCode(),
    latitude: faker.address.latitude(),
    longitude: faker.address.longitude(),
    card_back_url: faker.internet.url(),
    card_front_url: faker.internet.url(),
    insurance_classification: 'medicare-advantage',
    insurance_classification_id: faker.datatype.number(),
    primary_insurance_holder: primaryInsuranceHolder,
    card_back: cardImageUrls,
    card_front: cardImageUrls,
    ...userDefinedValues,
  };

  return insurance;
}
