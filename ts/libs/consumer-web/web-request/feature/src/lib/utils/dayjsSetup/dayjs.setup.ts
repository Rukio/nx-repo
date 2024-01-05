import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

export const dayjsSetup = () => {
  dayjs.extend(utc);
  dayjs.extend(isToday);
  dayjs.extend(isTomorrow);
};
