// TODO(ON-794): migrate to `date-fns` package
import dayjs, { UnitType } from 'dayjs';

export enum DaysEnum {
  today = 'today',
  tomorrow = 'tomorrow',
}

export enum TimePeriod {
  Morning = 'Morning',
  Afternoon = 'Afternoon',
  Evening = 'Evening',
}

export const getTomorrowDate = (date?: Date): Date => {
  const today = date ? new Date(date) : new Date();

  return new Date(today.setDate(today.getDate() + 1));
};

export const getMonthDayFormattedDate = (date: Date) =>
  `${dayjs(date).format('M')}/${dayjs(date).format('DD')}`;

export const isFutureDate = (date?: Date | string) => {
  if (!dayjs(date).isValid()) {
    return false;
  }

  return dayjs(date).isAfter(dayjs().utc(true));
};

export const isSameTime = (
  firstDate?: Date | string,
  secondDate?: Date | string
) => {
  if (!firstDate || !secondDate) {
    return false;
  }

  return dayjs(firstDate).isSame(dayjs(secondDate), 'hour');
};

export const getTimePeriod = (timePeriod?: TimePeriod) => {
  let startUtcDate = dayjs().utc(true);
  let endUtcDate = dayjs().utc(true);
  if (timePeriod === TimePeriod.Morning) {
    startUtcDate = startUtcDate.set('hour', 7);
    endUtcDate = endUtcDate.set('hour', 12);
  }
  if (timePeriod === TimePeriod.Afternoon) {
    startUtcDate = startUtcDate.set('hour', 12);
    endUtcDate = endUtcDate.set('hour', 17);
  }
  if (timePeriod === TimePeriod.Evening) {
    startUtcDate = startUtcDate.set('hour', 17);
    endUtcDate = endUtcDate.set('hour', 22);
  }

  return {
    start: startUtcDate.startOf('hour').toDate(),
    end: endUtcDate.startOf('hour').toDate(),
  };
};

export const getVisitDay = (date?: string | Date) => {
  if (!date) {
    return '';
  }

  const dayjsDate = dayjs(date);

  if (dayjsDate.isToday()) {
    return 'today';
  }
  if (dayjsDate.isTomorrow()) {
    return 'tomorrow';
  }

  return '';
};

export const ceilDate = (
  date: string | Date,
  unit: Exclude<UnitType, 'date' | 'dates'>,
  amount: number
) => {
  const transformedDate = dayjs(date);

  return transformedDate
    .add(amount - (transformedDate.get(unit) % amount), unit)
    .startOf(unit);
};
