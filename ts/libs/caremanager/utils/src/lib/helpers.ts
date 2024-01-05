import { isEmpty } from 'rambda';
import { differenceInDays, differenceInYears, startOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { defaultDateTimeFormatOptions } from './constants';

export const isEmptyAddress = (address: unknown[]) =>
  address.every((value) => value === '-' || isEmpty(value));

export const calculateAge = (dateOfBirth: string): number => {
  return differenceInYears(new Date(), new Date(dateOfBirth));
};

export const getParsedDate = (dateOfBirth: string): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateOfBirth));

export const abridgedText = (text: string, maxLength: number): string => {
  const finalEllipsis = text.length > maxLength ? '...' : '';

  return `${text.substring(0, maxLength)}${finalEllipsis}`;
};

export const calculateDays = (
  startDate: Date,
  endDate = new Date()
): number => {
  const zonedStartDate = startOfDay(
    utcToZonedTime(startDate, 'America/Denver')
  );
  const zonedEndDate = startOfDay(utcToZonedTime(endDate, 'America/Denver'));

  return differenceInDays(zonedEndDate, zonedStartDate);
};

export const formattedDate = (
  input: string | Date,
  options: Intl.DateTimeFormatOptions = defaultDateTimeFormatOptions
): string => {
  const date = new Date(input);

  return date.toLocaleDateString('en-US', {
    ...defaultDateTimeFormatOptions,
    ...options,
  });
};

export const formattedDOB = (input: string | Date): string =>
  formattedDate(input, { timeZone: 'UTC' });

export const getShortDateDescription = (date: Date): string =>
  formattedDate(date, {
    month: 'short',
    day: 'numeric',
  });

export const capitalize = (string: string): string =>
  string.charAt(0).toUpperCase() + string.slice(1);

export const sexStringToChar = (sex: string): string => {
  const sexMap: { [key: string]: string } = {
    unspecified: 'U',
    female: 'F',
    male: 'M',
    other: 'O',
  };

  return sexMap[sex] || '';
};

export const sortByName = <T extends { name: string }>(items: T[] = []): T[] =>
  [...items].sort((a, b) => (a.name > b.name ? 1 : -1));

export const getAvatarInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const formattedDateWithTime = (date: Date) =>
  `${date
    .toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    .replace(',', ' at')}`;

export const formattedShortDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

export const formatDataTestId = (testId: string) =>
  testId.replace(/[ _().]/g, '-').toLowerCase();

export interface PatientLike {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export const getFullName = ({ firstName, middleName, lastName }: PatientLike) =>
  `${firstName} ${middleName ?? ''} ${lastName}`.replace(/\s+/g, ' ').trim();
