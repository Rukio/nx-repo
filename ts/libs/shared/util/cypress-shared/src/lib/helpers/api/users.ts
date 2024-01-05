import { Markets } from '../../types/api/markets';
import { Shifts } from '../../types/api/shifts';
import { ProviderRole, Users } from '../../types/api/users';
import { sendGETRequest, sendPATCHRequest, sendPOSTRequest } from './request';

const doctor: ProviderRole = {
  name: 'Doctor',
  position: 'virtual doctor',
};
const app: ProviderRole = {
  name: 'APP',
  position: 'advanced practice provider',
};
const tech: ProviderRole = {
  name: 'Tech',
  position: 'emt',
};
const VIRTUAL_PROVIDER_ROLES = [app];
const VIRTUAL_DHMT_PROVIDER_ROLES = [doctor, tech];
const PROVIDER_ROLES = [doctor, app, tech];

const USER_BODY = {
  mobile_number: '3035001518',
};
const PROVIDER_ATTRIBUTES_BODY = {
  credentials: 'MD',
  position: 'advanced practice provider',
  is_public_profile: 0,
  can_see_pediatric_patients: 1,
};
const PROVIDER_LICENSE_BODY = {
  license_number: '1992093',
  expiration: '2036-12-01',
};
const DEFAULT_ROLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14];

const capitalizeString = (str = '') => {
  const firstLetter = str.slice(0, 1);

  return str.replace(firstLetter, firstLetter.toUpperCase());
};
const createShiftMemberFirstName = ({
  shortName,
  instance,
}: Shifts.NameGeneration) => `Automation${shortName}${instance}`;
const createShiftMemberEmail = ({
  shortName,
  name,
  instance,
}: Users.EmailGeneration) =>
  `automation_${shortName.toLowerCase()}_${name.toLowerCase()}${instance}@testEmail.com`;

// NOTE: Your automation test user MUST have the role-admin role selected in order to add all the role_ids
function createUser({
  marketId,
  firstName,
  lastName,
  email,
  position,
}: Users.User) {
  const userBody = {
    user: {
      ...Cypress._.cloneDeep(USER_BODY),
      role_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14],
      email,
      first_name: firstName,
      last_name: lastName,
      market_ids: [marketId],
      provider_profile_attributes: {
        ...Cypress._.cloneDeep(PROVIDER_ATTRIBUTES_BODY),
        position,
      },
    },
    commit: 'SAVE',
  };

  return sendPOSTRequest({
    url: `/admin/users`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: userBody,
  });
}

function updateUser({ id, position, roleIdList }: Users.UpdateUser) {
  const userBody = {
    user: {
      ...Cypress._.cloneDeep(USER_BODY),
      role_ids: roleIdList,
      provider_profile_attributes: {
        ...Cypress._.cloneDeep(PROVIDER_ATTRIBUTES_BODY),
        position,
      },
    },
    commit: 'SAVE',
  };

  return sendPATCHRequest({
    url: `/admin/users/${id}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: userBody,
  });
}

function getAdminUserPage({ id }: Users.UserId) {
  return sendGETRequest({
    url: `/admin/users/${id}/edit`,
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    },
    form: true,
  });
}

function createProviderLicense({
  id,
  position,
  state,
}: Users.UserId & Users.Position & Markets.State) {
  // Tech's don't require a license
  if (position === tech.position) {
    return;
  }

  const licenseBody = {
    provider_license: {
      ...Cypress._.cloneDeep(PROVIDER_LICENSE_BODY),
      state,
    },
    commit: 'ADD LICENSE',
  };

  sendPOSTRequest({
    url: `/admin/users/${id}/provider_licenses`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: licenseBody,
  });
}

function getCurrentUser() {
  return sendGETRequest({
    url: '/api/users/user.json',
  }).then((resp) => resp.body);
}

function getAllProviders({ id }: Markets.MarketId) {
  return sendGETRequest({
    url: `/api/markets/${id}/providers`,
  });
}

function setRolesForShift(shiftType: string, isVirtual: boolean) {
  if (isVirtual) {
    return VIRTUAL_DHMT_PROVIDER_ROLES;
  }

  switch (shiftType) {
    case 'telepresentation_solo_dhmt':
      return VIRTUAL_DHMT_PROVIDER_ROLES;
    case 'telepresentation_virtual_app':
      return VIRTUAL_PROVIDER_ROLES;
    default:
      return PROVIDER_ROLES;
  }
}

function createTestUsers({
  market,
  shiftType,
  isVirtual = false,
  isSelfShift = false,
  instance,
  currentInstance,
  providerRspList,
  loginUser,
}: Users.CreateTestUser) {
  const {
    id: marketId,
    shortName,
    careRequestAddress: { state },
    fullState,
  } = market;

  const providerRoles = setRolesForShift(shiftType, isVirtual);
  if (providerRoles === VIRTUAL_PROVIDER_ROLES) {
    isSelfShift = true;
  }

  const currentShiftMembers: Array<
    Users.UserId & Users.Name & Users.FirstName & Users.LastName & Users.Role
  > = [];
  providerRoles.forEach((role) => {
    const { position, name } = role;
    // Only add current logged-in user as app
    if (isSelfShift && position === app.position) {
      cy.fixture('loginUsers').then((loginUsers) => {
        const { firstName, lastName } = loginUsers[loginUser || 'admin'];

        const existingUser = providerRspList.find(
          (p) => p && p.first_name === firstName && p.last_name === lastName
        );

        if (existingUser) {
          const id = existingUser.id;

          cy.getCurrentUser().then((user) => {
            const roleIdList = user.roles?.map((r) => r.id) || DEFAULT_ROLES;
            updateUser({ id, position, roleIdList });
          });

          getAdminUserPage({ id }).then((resp) => {
            const doc = document.createElement('html');
            doc.innerHTML = resp.body;
            const existingLicenseList = doc.querySelectorAll(
              'div[data-testid="existing-license-row"]'
            );

            let needsLicense = true;
            existingLicenseList.forEach((existingLicense) => {
              if (
                (existingLicense as HTMLElement).outerText.includes(fullState)
              ) {
                needsLicense = false;
              }
            });
            if (needsLicense) {
              createProviderLicense({
                id,
                position,
                state,
              });
            }
          });

          currentShiftMembers.push({
            id,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            role: position,
          });
        }
      });
    } else {
      const userFirstName = createShiftMemberFirstName({
        shortName: capitalizeString(shortName.toLowerCase()),
        instance: instance + 1,
      });
      const userLastName = capitalizeString(name);

      const existingUser = providerRspList.find(
        (p) =>
          p && p.first_name === userFirstName && p.last_name === userLastName
      );

      const email = createShiftMemberEmail({
        shortName,
        name,
        instance: instance + 1,
      });

      if (!existingUser) {
        createUser({
          marketId,
          firstName: userFirstName,
          lastName: userLastName,
          email,
          position,
        }).then((createUserRsp) => {
          const { id } = createUserRsp.body;
          currentShiftMembers.push({
            id,
            firstName: userFirstName,
            lastName: userLastName,
            name: `${userFirstName} ${userLastName}`,
            role: position,
          });
          createProviderLicense({
            id,
            position,
            state,
          });
        });
      } else {
        currentShiftMembers.push({
          id: existingUser.id,
          firstName: userFirstName,
          lastName: userLastName,
          name: `${userFirstName} ${userLastName}`,
          role: position,
        });
      }
    }
  });

  const currentShiftsInfo = Cypress.env('currentShiftsInfo') || {};
  const currentShiftInfo = currentShiftsInfo
    ? currentShiftsInfo[currentInstance]
    : {};

  const updatedShiftInfo = {
    ...Cypress._.cloneDeep(currentShiftInfo),
    shiftMemberList: currentShiftMembers,
  };

  currentShiftsInfo[currentInstance] = updatedShiftInfo;
  Cypress.env('currentShiftsInfo', currentShiftsInfo);
}

function createTestUsersIfNotExist({
  market,
  shifts,
  loginUser,
}: Users.CreateTestUsers) {
  getAllProviders({ id: market.id }).then((getProvidersRsp) => {
    let currentInstance = Cypress.env('currentUsersInstance') || 0;
    for (let i = 0; i < shifts.length; i += 1) {
      createTestUsers({
        market,
        instance: i,
        currentInstance,
        providerRspList: getProvidersRsp.body,
        shiftType: shifts[i].shiftType,
        isVirtual: shifts[i].isVirtual,
        isSelfShift: shifts[i].isSelfShift,
        loginUser,
      });
      currentInstance += 1;
    }
    Cypress.env('currentUsersInstance', currentInstance);
  });
}

export { getCurrentUser, createTestUsersIfNotExist, doctor, app };
