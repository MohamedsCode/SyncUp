export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));

export const formatDateOnly = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(value));

export const formatRelativeUrgency = (value: string) => {
  const now = Date.now();
  const target = new Date(value).getTime();
  const diffHours = Math.round((target - now) / (1000 * 60 * 60));

  if (diffHours < 0) {
    return `${Math.abs(diffHours)}h overdue`;
  }
  if (diffHours <= 24) {
    return `due in ${diffHours}h`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `due in ${diffDays}d`;
};

export const dayLabel = (dayOfWeek: number) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek];
