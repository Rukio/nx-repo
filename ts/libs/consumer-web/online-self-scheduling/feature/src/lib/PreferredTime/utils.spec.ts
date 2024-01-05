import { AvailabilityDayToggleValue } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { preferredTimeFormSchema } from './utils';

describe('utils', () => {
  describe('preferredTimeFormSchema', () => {
    it.each([
      {
        name: 'empty values',
        values: {
          startTime: '',
          endTime: '',
          selectedAvailabilityDay: '',
        },
        expectedResult: false,
      },
      {
        name: 'incorrect values',
        values: {
          startTime: 'test',
          endTime: 'test',
          selectedAvailabilityDay: 'test',
        },
        expectedResult: false,
      },
      {
        name: 'correct time with AvailabilityDayToggleValue.Today',
        values: {
          startTime: '1',
          endTime: '10',
          selectedAvailabilityDay: AvailabilityDayToggleValue.Today,
        },
        expectedResult: true,
      },
      {
        name: 'correct time with AvailabilityDayToggleValue.Tomorrow',
        values: {
          startTime: '1',
          endTime: '10',
          selectedAvailabilityDay: AvailabilityDayToggleValue.Tomorrow,
        },
        expectedResult: true,
      },
    ])(
      'should return correct valid result for $name',
      async ({ values, expectedResult }) => {
        const isValid = await preferredTimeFormSchema.isValid(values);
        expect(isValid).toBe(expectedResult);
      }
    );
  });
});
