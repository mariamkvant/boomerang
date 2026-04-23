// Simplified status badge — 3 colors max
export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    accepted: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    delivered: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    completed: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
    disputed: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
    open: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    closed: 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-500';
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    accepted: 'In progress',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
    open: 'Open',
    closed: 'Closed',
  };
  return map[status] || status;
}
