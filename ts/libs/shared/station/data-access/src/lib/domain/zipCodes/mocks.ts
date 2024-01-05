import { ZipCodeDetails } from '../../types';
import { ZipCodeDetailsQuery } from './zipCodes.slice';

export const mockZipCodeDetailsQuery: ZipCodeDetailsQuery = {
  zipCode: 12345,
};

export const mockZipCodeDetails: ZipCodeDetails = {
  id: 1,
  market_id: 20,
  billing_city_id: 111,
};
