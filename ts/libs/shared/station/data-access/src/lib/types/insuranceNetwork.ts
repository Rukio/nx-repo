export interface InsuranceNetworkAddress {
  address_line_one?: string;
  address_line_two?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface InsuranceNetwork {
  id: number;
  name: string;
  notes: string;
  package_id: number;
  insurance_classification_id: number;
  insurance_plan_id: number;
  insurance_payer_id: number;
  address: InsuranceNetworkAddress;
  eligibility_check: boolean;
  provider_enrollment: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  state_abbrs: string[];
}
