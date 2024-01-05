import { addDays, format } from 'date-fns';
import {
  AvailibilityDay,
  formatDate,
  getAvailabilityDay,
  getHoursSelectList,
  getMarketTimeSelectList,
} from './date';

describe('date utils', () => {
  describe('getHoursSelectList', () => {
    it.each([
      { minHour: 0, maxHour: 23, expectedLength: 24 },
      { minHour: 5, maxHour: 12, expectedLength: 8 },
      { minHour: 10, maxHour: 10, expectedLength: 1 },
      { minHour: 15, maxHour: 14, expectedLength: 0 },
      { minHour: -1, maxHour: 20, expectedLength: 0 },
      { minHour: 3, maxHour: 30, expectedLength: 0 },
    ])(
      'should return an array of $expectedLength elements from $minHour to $maxHour',
      ({ expectedLength, minHour, maxHour }) => {
        const result = getHoursSelectList(minHour, maxHour);
        expect(result).toHaveLength(expectedLength);
      }
    );

    it('should return items with correct value and label properties', () => {
      const result = getHoursSelectList(8, 10);
      expect(result).toEqual([
        { value: '8', label: expect.stringContaining('8:00') },
        { value: '9', label: expect.stringContaining('9:00') },
        { value: '10', label: expect.stringContaining('10:00') },
      ]);
    });
  });

  describe('getMarketTimeSelectList', () => {
    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date('2023-07-05T08:00:00.000Z'));
    });

    afterAll(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it.each([
      {
        marketStartTime: '2023-07-05T07:00:00.000Z',
        marketEndTime: '2023-07-05T10:00:00.000Z',
        marketTimeZone: 'America/Denver',
        expected: [
          { value: '7', label: '07:00 am' },
          { value: '8', label: '08:00 am' },
          { value: '9', label: '09:00 am' },
          { value: '10', label: '10:00 am' },
        ],
      },
      {
        marketStartTime: '',
        marketEndTime: '2023-07-05T10:00:00.000Z',
        marketTimeZone: 'America/Denver',
        expected: [],
      },
      {
        marketStartTime: '2023-07-05T07:00:00.000Z',
        marketEndTime: '',
        marketTimeZone: 'America/Denver',
        expected: [],
      },
      {
        marketStartTime: '2023-07-05T07:00:00.000Z',
        marketEndTime: '2023-07-05T10:00:00.000Z',
        marketTimeZone: '',
        expected: [],
      },
    ])(
      'should return market time list',
      ({ marketStartTime, marketEndTime, marketTimeZone, expected }) => {
        expect(
          getMarketTimeSelectList(
            marketStartTime,
            marketEndTime,
            marketTimeZone
          )
        ).toEqual(expected);
      }
    );
  });

  describe('formatDate', () => {
    it.each([
      {
        dateString: '2023-07-05T07:00:00.000Z',
        timezone: 'America/Denver',
        formatString: 'h:mm a',
        expectedFormattedDate: '1:00 AM',
      },
      {
        dateString: '2023-07-05T00:00:00.000Z',
        timezone: 'America/New_York',
        formatString: 'h:mm a',
        expectedFormattedDate: '8:00 PM',
      },
      {
        dateString: undefined,
        timezone: 'Asia/Tokyo',
        formatString: 'h:mm a',
        expectedFormattedDate: '',
      },
      {
        dateString: 'invalid date',
        timezone: 'Asia/Tokyo',
        formatString: 'h:mm a',
        expectedFormattedDate: '',
      },
    ])(
      'formats a date string correctly',
      ({ dateString, timezone, formatString, expectedFormattedDate }) => {
        const formattedDate = formatDate(dateString, timezone, formatString);
        expect(formattedDate).toEqual(expectedFormattedDate);
      }
    );
  });

  describe('getAvailabilityDay', () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const todayDateString = format(today, "yyyy-MM-dd'T'HH:mm:ssXXX");
    const tomorrowDateString = format(tomorrow, "yyyy-MM-dd'T'HH:mm:ssXXX");

    it.each([
      {
        dateString: todayDateString,
        timezone: 'UTC',
        expected: AvailibilityDay.Today,
      },
      {
        dateString: tomorrowDateString,
        timezone: 'UTC',
        expected: AvailibilityDay.Tomorrow,
      },
      {
        dateString: '',
        timezone: 'UTC',
        expected: AvailibilityDay.Today,
      },
    ])(
      'returns correct availability day',
      ({ expected, dateString, timezone }) => {
        const result = getAvailabilityDay(dateString, timezone);
        expect(result).toEqual(expected);
      }
    );
  });
});
