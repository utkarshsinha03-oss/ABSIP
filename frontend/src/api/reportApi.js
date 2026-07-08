import api from './axios';

/**
 * Fetch all incidents.
 * GET /incidents
 * @returns {Promise<import('../types').Incident[]>}
 */
export const getIncidents = () =>
  api.get('/incidents').then((res) => res.data);

/**
 * Fetch a single incident by ID.
 * GET /incidents/:id
 * @param {string|number} id
 */
export const getIncidentById = (id) =>
  api.get(`/incidents/${id}`).then((res) => res.data);