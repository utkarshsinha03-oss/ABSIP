export const formatDate = (date, opts = {}) => {
  const d = date instanceof Date ? date : new Date(date);
  const defaults = { year: 'numeric', month: 'short', day: '2-digit' };
  return d.toLocaleDateString('en-IN', { ...defaults, ...opts });
};

export const formatTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

export const formatDateTime = (date) => `${formatDate(date)} ${formatTime(date)}`;

export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
