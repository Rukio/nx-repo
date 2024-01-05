import { object, ObjectSchema, mixed, string } from 'yup';
import {
  AvailabilityDayToggleValue,
  SelectTimeWindowFieldValues,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';

const NUMERIC_STRING_REGEX = /^\d+$/;

const timeSchema = string()
  .required()
  .matches(NUMERIC_STRING_REGEX, 'Invalid hour');

export const preferredTimeFormSchema: ObjectSchema<SelectTimeWindowFieldValues> =
  object()
    .shape({
      startTime: timeSchema,
      endTime: timeSchema,
      selectedAvailabilityDay: mixed<AvailabilityDayToggleValue>()
        .required()
        .oneOf(Object.values(AvailabilityDayToggleValue)),
    })
    .required();
