import { BillingCity, StationBillingCity } from './billing-city';
import { StationPatient, Patient } from './patient';
import { ShiftTeam, StationShiftTeam } from './shift-team';

export interface User {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  authenticationToken?: string;
  inContactAgentId?: string | number;
  alias?: string;
  genesysId?: string | number;
  genesysToken?: string | number;
  hrEmployeeId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  accountId?: number;
  currentShiftTeam?: ShiftTeam;
  canViewTelepresentationRequests?: boolean;
  hasAllMarkets?: boolean;
  billingCities?: BillingCity[];
  hasAllBillingCities?: boolean;
  patients?: Patient[];
  roles?: Role[];
  markets?: [];
}

export interface StationUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  authentication_token: string;
  in_contact_agent_id: string | number;
  alias: string;
  genesys_id: string | number;
  genesys_token: string | number;
  hr_employee_id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  account_id: number;
  current_shift_team: StationShiftTeam;
  can_view_telepresentation_requests: boolean;
  has_all_markets: boolean;
  billing_cities: StationBillingCity[];
  has_all_billing_cities: boolean;
  patients: StationPatient[];
  roles: StationRole[];
  markets: [];
}

export interface StationRole {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  permissions: StationRolePermission[];
}

export interface StationRolePermission {
  id: number;
  action: string;
  scope: string;
  resource: string;
  role_id: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id?: number;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: RolePermission[];
}

export interface RolePermission {
  id?: number;
  action?: string;
  scope?: string;
  resource?: string;
  roleId?: number;
  createdAt?: string;
  updatedAt?: string;
}
