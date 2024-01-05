import { MarketFeasibilityStatus } from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  isMarketFeasibilityLimited,
  isMarketFeasibilityAvailable,
  getFiveDigitZipCode,
} from './market';

describe('market utils', () => {
  describe('isMarketFeasibilityLimited', () => {
    it.each([
      {
        availability: MarketFeasibilityStatus.Available,
        expectedResult: false,
      },
      {
        availability: MarketFeasibilityStatus.Limited,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.LimitedLocation,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.LimitedNearingCapacity,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.LimitedServiceDuration,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.Unavailable,
        expectedResult: false,
      },
      {
        availability: undefined,
        expectedResult: false,
      },
    ])(
      'should return the correct result if the passed value is $availability',
      ({ availability, expectedResult }) => {
        const result = isMarketFeasibilityLimited(availability);
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe('isMarketFeasibilityAvailable', () => {
    it.each([
      {
        availability: MarketFeasibilityStatus.Available,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.Limited,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.LimitedLocation,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.LimitedNearingCapacity,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.LimitedServiceDuration,
        expectedResult: true,
      },
      {
        availability: MarketFeasibilityStatus.Unavailable,
        expectedResult: false,
      },
      {
        availability: undefined,
        expectedResult: false,
      },
    ])(
      'should return the correct result if the passed value is $availability',
      ({ availability, expectedResult }) => {
        const result = isMarketFeasibilityAvailable(availability);
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe('getFiveDigitZipCode', () => {
    it.each([
      {
        zipCode: '80205-3339',
        expectedResult: '80205',
      },
      {
        zipCode: '80205',
        expectedResult: '80205',
      },
      {
        zipCode: '',
        expectedResult: '',
      },
    ])(
      'should return the correct actual zip code if the passed value is "$zipCode"',
      ({ zipCode, expectedResult }) => {
        const result = getFiveDigitZipCode(zipCode);
        expect(result).toEqual(expectedResult);
      }
    );
  });
});
