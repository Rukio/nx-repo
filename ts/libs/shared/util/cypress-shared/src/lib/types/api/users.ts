import { Id, Instance, Shifts } from './shifts';
import { Markets } from './markets';

export type PROVIDER_POSITIONS =
  | 'virtual doctor'
  | 'advanced practice provider'
  | 'emt';
export type ProviderRole = {
  name: string;
  position: PROVIDER_POSITIONS;
};

export declare namespace Users {
  type UserId = Id;
  type Position = {
    position: string;
  };
  type Role = {
    role: string;
  };
  type FirstName = {
    firstName: string;
  };
  type LastName = {
    lastName: string;
  };
  type Name = {
    name: string;
  };
  type LoginUser = {
    loginUser?: string;
  };
  type EmailGeneration = Shifts.NameGeneration & Name;

  type User = Position &
    FirstName &
    LastName & {
      marketId: string | number;
      email: string;
      roles?: Array<Id>;
    };
  type Provider = UserId & {
    first_name: string;
    last_name: string;
    provider_profile_position?: string;
    role: PROVIDER_POSITIONS;
  };

  type CreateTestUsers = LoginUser &
    Markets.Market & {
      shifts: Array<Shifts.ShiftInfo>;
    };
  type CreateTestUser = LoginUser &
    Shifts.ShiftInfo &
    Markets.Market & {
      instance: Instance;
      currentInstance: Instance;
      providerRspList: Array<Provider>;
    };
  type UpdateUser = UserId &
    Position & {
      roleIdList: Array<number | string>;
    };
}
