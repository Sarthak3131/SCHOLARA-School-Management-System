/**
 * Format a date string for display.
 * @param {string|Date} date
 * @param {object} options - Intl.DateTimeFormat options
 */
export const formatDate = (date, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(date));
};

/**
 * Format a currency amount in INR.
 */
export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/**
 * Calculate grade from percentage using the GRADE_CONFIG array.
 */
export const getGrade = (percentage, gradeConfig) => {
  if (!gradeConfig || !gradeConfig.length) return { grade: 'N/A', remark: '' };
  const match = gradeConfig.find(g => percentage >= g.min && percentage <= g.max);
  return match || { grade: 'F', remark: 'Fail' };
};

/**
 * Truncate text to a given length.
 */
export const truncate = (str = '', length = 50) =>
  str.length > length ? `${str.slice(0, length)}…` : str;

/**
 * Capitalise the first letter of each word.
 */
export const titleCase = (str = '') =>
  str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

/**
 * Build paginated query params string.
 */
export const buildQueryString = (params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return new URLSearchParams(filtered).toString();
};

/**
 * Returns initials from a full name string.
 */
export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
