import { skipToken } from '@reduxjs/toolkit/query';
import { prepareCheckMarketFeasibilityPayload } from './mappers';
import { mockCheckMarketFeasibilityPayload } from './mocks';

describe('mappers', () => {
  describe('prepareCheckMarketFeasibilityPayload', () => {
    it.each([
      {
        name: 'generated payload',
        props: {
          ...mockCheckMarketFeasibilityPayload,
        },
        expected: mockCheckMarketFeasibilityPayload,
      },
      {
        name: 'skipToken because zipcode field is not valid',
        props: {
          ...mockCheckMarketFeasibilityPayload,
          zipcode: '',
        },
        expected: skipToken,
      },
      {
        name: 'skipToken because marketId field is not valid',
        props: {
          ...mockCheckMarketFeasibilityPayload,
          marketId: undefined,
        },
        expected: skipToken,
      },
      {
        name: 'skipToken because date field is not valid',
        props: {
          ...mockCheckMarketFeasibilityPayload,
          date: '',
        },
        expected: skipToken,
      },
    ])('should correctly return $name', ({ props, expected }) => {
      const { zipcode, marketId, date } = props;
      const payload = prepareCheckMarketFeasibilityPayload(
        zipcode,
        marketId,
        date
      );
      expect(payload).toEqual(expected);
    });
  });
});
