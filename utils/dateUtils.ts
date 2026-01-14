export const daysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const addMonths = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + amount);
  return newDate;
};

export const addDays = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + amount);
  return newDate;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleString('pt-BR', { month: 'long' });
};

export const getDayName = (date: Date): string => {
  return date.toLocaleString('pt-BR', { weekday: 'short' }).replace('.', '');
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const getCalendarDays = (currentDate: Date): Date[] => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days: Date[] = [];

    // Add padding days from previous month
    const startDay = start.getDay(); // 0 (Sun) to 6 (Sat)
    for (let i = startDay; i > 0; i--) {
        days.push(addDays(start, -i));
    }

    // Add days of current month
    for (let i = 1; i <= end.getDate(); i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    // Add padding days for next month to fill 6 rows (42 days) standard calendar
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        days.push(addDays(end, i));
    }

    return days;
};

// Verifica se um período (start-end) sobrepõe o dia atual
export const isDateInRange = (checkDate: Date, startDateStr: string, endDateStr?: string): boolean => {
    const start = new Date(startDateStr);
    const checkTime = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()).getTime();
    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    
    // Se não tem data final, assumimos 30 dias de duração padrão para visualização
    let endTime: number;
    if (endDateStr) {
        const end = new Date(endDateStr);
        endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    } else {
        endTime = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 30).getTime();
    }

    return checkTime >= startTime && checkTime <= endTime;
};