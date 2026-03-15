import { startOfWeek, format } from "date-fns";

export interface WeekKey {
  weekStart: number;
}

export interface WeekGroup<T> {
  key: WeekKey;
  label: string;
  items: T[];
}

export function getWeekStart(timestamp: number): number {
  const date = new Date(timestamp);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return weekStart.getTime();
}

export function formatWeekLabel(weekStart: number): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(start.getDate() + 6);

  const sameMonth = start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${format(start, "d")}–${format(end, "d MMM yyyy")}`;
  }

  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}

export function groupByWeek<T extends { savedAt: number }>(items: T[]): WeekGroup<T>[] {
  const byWeek = new Map<number, T[]>();

  for (const item of items) {
    const weekStart = getWeekStart(item.savedAt);
    const existing = byWeek.get(weekStart) ?? [];
    existing.push(item);
    byWeek.set(weekStart, existing);
  }

  const sortedWeeks = Array.from(byWeek.entries()).sort(([a], [b]) => b - a);

  return sortedWeeks.map(([weekStart, groupItems]) => ({
    key: { weekStart },
    label: formatWeekLabel(weekStart),
    items: groupItems,
  }));
}
