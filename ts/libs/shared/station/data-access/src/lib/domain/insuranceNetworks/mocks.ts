import { InsuranceNetwork } from '../../types';

export const mockedInsuranceNetwork: InsuranceNetwork = {
  id: 1,
  name: 'Awesome Network',
  active: true,
  package_id: 999,
  notes: 'very cool network',
  insurance_classification_id: 1,
  insurance_plan_id: 1,
  insurance_payer_id: 1,
  eligibility_check: true,
  provider_enrollment: true,
  address: {
    address_line_one: 'Address',
    city: 'City',
    state: '112',
    zip_code: '80105',
  },
  created_at: '2023-03-21T14:44:44.432Z',
  updated_at: '2023-03-21T14:44:44.432Z',
  deleted_at: null,
  state_abbrs: [],
};
