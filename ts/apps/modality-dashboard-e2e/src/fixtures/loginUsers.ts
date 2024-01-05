export type LoginUser = {
  username: string;
  password: string;
  fullName: string;
  firstName: string;
  lastName: string;
};

const makeLoginUserMap = <T>(map: {
  [K in keyof T]: LoginUser;
}) => map;

export const loginUsers = makeLoginUserMap({
  admin: {
    username: 'qa-automation-admin@*company-data-covered*.com',
    password: process.env['NX_CYPRESS_STATION_PASSWORD_ADMIN'],
    fullName: 'qa-admin automation',
    firstName: 'qa-admin',
    lastName: 'automation',
  },
});

export type UserKey = keyof typeof loginUsers;
