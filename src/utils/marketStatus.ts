import { MarketSession } from '../types';

export function getCETTime(): {
  date: Date;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  hours: number;
  minutes: number;
  timeString: string;
} {
  const now = new Date();
  
  // Format parts in Europe/Berlin (CET/CEST)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    hour12: false,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const parts = dtf.formatToParts(now);
  let weekdayStr = '';
  let hours = 0;
  let minutes = 0;

  for (const part of parts) {
    if (part.type === 'weekday') weekdayStr = part.value;
    if (part.type === 'hour') hours = parseInt(part.value, 10);
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }

  const daysMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayOfWeek = daysMap[weekdayStr] ?? now.getDay();
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} CET`;

  return { date: now, dayOfWeek, hours, minutes, timeString };
}

export function getMarketSessions(): MarketSession[] {
  const { dayOfWeek, hours, minutes } = getCETTime();
  const currentTotalMins = hours * 60 + minutes;
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  // 1. XETRA: Mon-Fri 09:00 - 17:30 CET
  const xetraOpenMins = 9 * 60; // 540
  const xetraCloseMins = 17 * 60 + 30; // 1050
  const isXetraOpen = isWeekday && currentTotalMins >= xetraOpenMins && currentTotalMins < xetraCloseMins;

  // 2. US Markets: Mon-Fri 15:30 - 22:00 CET
  const usOpenMins = 15 * 60 + 30; // 930
  const usCloseMins = 22 * 60; // 1320
  const isUsOpen = isWeekday && currentTotalMins >= usOpenMins && currentTotalMins < usCloseMins;

  // Crypto: 24/7 Always Open
  return [
    {
      name: 'XETRA',
      code: 'XETRA',
      isOpen: isXetraOpen,
      hoursDesc: '09:00 – 17:30 CET',
      timeUntilNext: isXetraOpen ? 'Open' : isWeekday && currentTotalMins < xetraOpenMins ? 'Opens 09:00' : 'Closed',
    },
    {
      name: 'US Markets',
      code: 'US',
      isOpen: isUsOpen,
      hoursDesc: '15:30 – 22:00 CET',
      timeUntilNext: isUsOpen ? 'Open' : isWeekday && currentTotalMins < usOpenMins ? 'Opens 15:30' : 'Closed',
    },
    {
      name: 'Crypto',
      code: 'CRYPTO',
      isOpen: true,
      hoursDesc: '24/7 Non-stop',
      timeUntilNext: 'Open 24/7',
    },
  ];
}
