import { User, StationUser } from '@*company-data-covered*/consumer-web-types';

const StationUserToUser = (input: StationUser): User => {
  const output: User = {
    id: input.id,
    firstName: input.first_name,
    lastName: input.last_name,
    email: input.email,
    mobileNumber: input.mobile_number,
    inContactAgentId: input.in_contact_agent_id,
    genesysId: input.genesys_id,
    genesysToken: input.genesys_token,
    hrEmployeeId: input.hr_employee_id,
    accountId: input.account_id,
    roles:
      input.roles &&
      input.roles.map((role) => ({
        id: role.id,
        name: role.name,
      })),
  };

  return output;
};

export default {
  StationUserToUser,
};
