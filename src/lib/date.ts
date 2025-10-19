import dayjs from 'dayjs';

export const formatDateKey = (date: dayjs.Dayjs = dayjs()) => date.format('YYYY-MM-DD');

export const getLastNDates = (n: number) => {
  const days: string[] = [];
  for (let i = 0; i < n; i += 1) {
    days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return days;
};

export const formatDisplayDate = (key: string) => dayjs(key).format('MMM D, YYYY');
