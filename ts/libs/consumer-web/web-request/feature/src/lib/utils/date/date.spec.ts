import dayjs from 'dayjs';
import {
  getTomorrowDate,
  getTimePeriod,
  TimePeriod,
  getVisitDay,
  ceilDate,
  getMonthDayFormattedDate,
  isFutureDate,
  isSameTime,
} from './date';

describe('date utils', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('1970-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('getTomorrowDate', () => {
    it("should return correct tomorrow's date if no date was provided", () => {
      const tomorrow = getTomorrowDate();
      expect(tomorrow).toStrictEqual(new Date('1970-01-02T00:00:00.000Z'));
    });

    it("should return correct tomorrow's of provided date", () => {
      const tomorrow = getTomorrowDate(new Date('1970-01-02T00:00:00.000Z'));
      expect(tomorrow).toStrictEqual(new Date('1970-01-03T00:00:00.000Z'));
    });
  });

  describe('getTimePeriod', () => {
    it('should return correct morning period', () => {
      const timePeriod = getTimePeriod(TimePeriod.Morning);
      expect(timePeriod).toStrictEqual({
        end: new Date('1969-12-31T12:00:00.000Z'),
        start: new Date('1969-12-31T07:00:00.000Z'),
      });
    });

    it('should return correct afternoon period', () => {
      const timePeriod = getTimePeriod(TimePeriod.Afternoon);
      expect(timePeriod).toStrictEqual({
        end: new Date('1969-12-31T17:00:00.000Z'),
        start: new Date('1969-12-31T12:00:00.000Z'),
      });
    });

    it('should return correct evening period', () => {
      const timePeriod = getTimePeriod(TimePeriod.Evening);
      expect(timePeriod).toStrictEqual({
        end: new Date('1969-12-31T22:00:00.000Z'),
        start: new Date('1969-12-31T17:00:00.000Z'),
      });
    });

    it('should return date without period if no time period was provided', () => {
      const timePeriod = getTimePeriod();
      expect(timePeriod).toStrictEqual({
        end: new Date('1969-12-31T17:00:00.000Z'),
        start: new Date('1969-12-31T17:00:00.000Z'),
      });
    });
  });

  describe('getVisitDay', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date());
    });

    it('should return - today', () => {
      const visitDay = getVisitDay(new Date().toString());
      expect(visitDay).toStrictEqual('today');
    });

    it('should return - tomorrow', () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);

      const visitDay = getVisitDay(date);
      expect(visitDay).toStrictEqual('tomorrow');
    });

    it('should return - empty string', () => {
      let visitDay = getVisitDay();
      expect(visitDay).toStrictEqual('');

      visitDay = getVisitDay('1969-12-31T17:00:00.000Z');
      expect(visitDay).toStrictEqual('');
    });
  });

  describe('ceilDate', () => {
    it('should return correct ceiled date to hour if unit and amount are 60 minutes', () => {
      const ceiledDate = ceilDate('2023-12-12T17:35:00.000Z', 'minute', 60);
      expect(ceiledDate).toEqual(dayjs('2023-12-12T18:00:00.000Z'));
    });

    it('should return correct ceiled date to next half an hour if unit and amount are 30 minutes', () => {
      const ceiledDate = ceilDate('2023-12-12T17:05:00.000Z', 'minute', 30);
      expect(ceiledDate).toEqual(dayjs('2023-12-12T17:30:00.000Z'));
    });

    it('should return correct ceiled date to hour if unit and amount are 1 hour', () => {
      const ceiledDate = ceilDate('2023-12-12T17:35:00.000Z', 'hour', 1);
      expect(ceiledDate).toEqual(dayjs('2023-12-12T18:00:00.000Z'));
    });
  });

  describe('getMonthDayFormattedDate', () => {
    it('should return correct formatted string', () => {
      const mockDate = new Date();
      const expectedResult = `${mockDate.getMonth() + 1}/${mockDate.getDate()}`;
      const result = getMonthDayFormattedDate(mockDate);
      expect(result).toBe(expectedResult);
    });
  });

  describe('isFutureDate', () => {
    it.each([
      {
        name: 'should return false if date is empty',
        date: '',
        expectedResult: false,
      },
      {
        name: 'should return false if date is before today',
        date: new Date('1969-01-01T00:00:00.000Z'),
        expectedResult: false,
      },
      {
        name: 'should return true if date is after today',
        date: new Date('2023-01-01T00:00:00.000Z'),
        expectedResult: true,
      },
    ])('$name', ({ date, expectedResult }) => {
      const result = isFutureDate(date);
      expect(result).toBe(expectedResult);
    });
  });

  describe('isSameTime', () => {
    it.each([
      {
        name: 'should return false if firstDate is empty',
        firstDate: '',
        secondDate: new Date(),
        expectedResult: false,
      },
      {
        name: 'should return false if secondDate is empty',
        firstDate: new Date(),
        secondDate: '',
        expectedResult: false,
      },
      {
        name: 'should return false if dates are not same',
        firstDate: new Date(),
        secondDate: new Date('2023-01-01T00:00:00.000Z'),
        expectedResult: false,
      },
      {
        name: 'should return false if dates are not same',
        firstDate: new Date(),
        secondDate: new Date(),
        expectedResult: true,
      },
    ])('$name', ({ firstDate, secondDate, expectedResult }) => {
      const result = isSameTime(firstDate, secondDate);
      expect(result).toBe(expectedResult);
    });
  });
});
