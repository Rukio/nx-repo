export type LoginUser = {
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  providerId: string;
};

const makeLoginUserMap = <T>(map: {
  [K in keyof T]: LoginUser;
}) => map;

export const loginUsers = makeLoginUserMap({
  provider: {
    username: 'qa-automation-provider@*company-data-covered*.com',
    fullName: 'qa-provider automation',
    firstName: 'qa-provider',
    lastName: 'automation',
    providerId: '85006',
  },
});

export type UserKey = keyof typeof loginUsers;
