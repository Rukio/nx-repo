import { Provider } from '@*company-data-covered*/consumer-web-types';

export const PROVIDER_MOCK: Provider = {
  id: 70613,
  email: 'zachary.acosta@*company-data-covered*.com',
  firstName: 'Zachary',
  lastName: 'Acosta',
  mobileNumber: '303-500-1518',
  providerImageTinyUrl:
    'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/tiny_zac.jpg',
  providerProfile: {
    position: 'emt',
    providerImage: {
      url: 'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/zac.jpg',
      thumb: {
        url: 'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/thumb_zac.jpg',
      },
      tiny: {
        url: 'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/1505/tiny_zac.jpg',
      },
    },
    isPublicProfile: false,
    webBio: '',
  },
  providerProfileCredentials: '',
  providerProfilePosition: 'emt',
  userMarkets: [
    {
      id: 22502,
      userId: 70613,
      marketId: 193,
      createdAt: '2020-11-19T23:36:27.363Z',
      updatedAt: '2020-11-19T23:36:27.363Z',
    },
  ],
};
