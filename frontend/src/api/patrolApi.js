import api from './axios';

/**
 * Fetch all patrols.
 * GET /patrols
 */
export const getPatrols = () =>
  api.get('/patrols').then((res) => res.data);

/**
 * Fetch a single patrol by ID.
 * GET /patrols/:id
 */
export const getPatrolById = (id) =>
  api.get(`/patrols/${id}`).then((res) => res.data);