import api from './axios';

/**
 * Fetch all sectors from the backend.
 * GET /sectors
 * @returns {Promise<import('../types').Sector[]>}
 */
export const getSectors = () =>
  api.get('/sectors').then((res) => res.data);

/**
 * Fetch a single sector by ID.
 * GET /sectors/:id
 * @param {string|number} id
 */
export const getSectorById = (id) =>
  api.get(`/sectors/${id}`).then((res) => res.data);
