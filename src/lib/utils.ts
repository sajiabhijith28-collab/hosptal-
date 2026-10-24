export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIN(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateLongIN(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hours12 = h % 12 || 12;
  return `${hours12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DayOption {
  date: string; // YYYY-MM-DD
  label: string; // e.g., "Today, 24 Oct" or "Mon, 26 Oct"
  shortDay: string;
  isToday: boolean;
}

export function getNext7Days(): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const isoDate = `${y}-${m}-${dayNum}`;

    const monthShort = d.toLocaleDateString('en-IN', { month: 'short' });
    const weekdayShort = d.toLocaleDateString('en-IN', { weekday: 'short' });

    let label = `${weekdayShort}, ${dayNum} ${monthShort}`;
    if (i === 0) label = `Today, ${dayNum} ${monthShort}`;
    if (i === 1) label = `Tomorrow, ${dayNum} ${monthShort}`;

    days.push({
      date: isoDate,
      label,
      shortDay: i === 0 ? 'Today' : weekdayShort,
      isToday: i === 0,
    });
  }

  return days;
}
