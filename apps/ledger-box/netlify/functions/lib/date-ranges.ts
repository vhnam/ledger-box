type DateRange = {
  start: Date;
  end: Date;
};

function parseDateInput(value: string): Date {
  return new Date(value);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getTodayRange(referenceDate: Date = new Date()): DateRange {
  return {
    start: startOfDay(referenceDate),
    end: endOfDay(referenceDate),
  };
}

export function getThisMonthRange(referenceDate: Date = new Date()): DateRange {
  return {
    start: startOfMonth(referenceDate),
    end: endOfMonth(referenceDate),
  };
}

export function getLastMonthRange(referenceDate: Date = new Date()): DateRange {
  const lastMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);

  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  };
}

export function getDateRange(from: string, to: string): DateRange {
  return {
    start: startOfDay(parseDateInput(from)),
    end: endOfDay(parseDateInput(to)),
  };
}
