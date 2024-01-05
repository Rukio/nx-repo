import * as faker from 'faker';
import { UploadedImageLocations } from '../types/upload-image-location';

export const buildMockUploadedImage = (
  userDefinedValues: Partial<UploadedImageLocations> = {}
): UploadedImageLocations => {
  return {
    url: faker.internet.url(),
    thumb: {
      url: faker.internet.url(),
    },
    small: {
      url: faker.internet.url(),
    },
    medium: {
      url: faker.internet.url(),
    },
    ...userDefinedValues,
  };
};
