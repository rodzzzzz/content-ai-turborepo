import { getTimeZones } from '@vvo/tzdb';
import { format, toZonedTime } from 'date-fns-tz';

export const getTimeZone = (timeZone: string) => {
  const timeZones = getTimeZones();

  return timeZones.find((tz) => {
    return timeZone === tz.name || tz.group.includes(timeZone);
  });
};

export const convertToZonedTime = (date: Date, timeZone: string) => {
  const zonedTime = toZonedTime(date, timeZone);
  return zonedTime;
};

export const formatDateWithTimeZone = (
  zonedTime: Date,
  timeZone: string,
  formatString: string,
) => {
  const formattedDate = format(zonedTime, formatString, { timeZone });
  return formattedDate;
};

// Converts a getTimezoneOffset() offset to one that can be used in new Date().
// Examples:
// Eastern Standard Time: 240 -> '-04:00'
// India Standard Time: -330 -> '+05:30'
// Australian Central Western Standard Time: -525 -> '+08:45'
export function getTimezoneOffset(d: Date) {
  return convertTimezoneOffset(d.getTimezoneOffset());
}

export function convertTimezoneOffset(offset: number) {
  const plusMinus = offset < 0 ? '-' : '+';
  const hours = Math.abs(Math.ceil(offset / 60)) + '';
  const minutes = (Math.abs(offset) % 60) + '';

  return `${plusMinus}${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

export function getOffsetFromTimezone(timezone: string) {
  return convertTimezoneOffset(
    getTimeZone(timezone)?.rawOffsetInMinutes ?? 0,
  );
}
