import api from './axios';

/**
 * Fetch all alerts.
 * GET /alerts
 * @returns {Promise<import('../types').Alert[]>}
 */
export const getAlerts = () =>
  api.get('/alerts').then((res) => res.data);

/**
 * Fetch a single alert by ID.
 * GET /alerts/:id
 * @param {string|number} id
 */
export const getAlertById = (id) =>
  api.get(`/alerts/${id}`).then((res) => res.data);
