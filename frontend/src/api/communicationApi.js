import api from './axios';

/**
 * Fetch all patrol logs.
 * GET /patrol-logs
 */
export const getPatrolLogs = () =>
  api.get('/patrol-logs').then((res) => res.data);