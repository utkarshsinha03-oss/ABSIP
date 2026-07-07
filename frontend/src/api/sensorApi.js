import api from './axios';

/**
 * Fetch all sensors.
 * GET /sensors
 * @returns {Promise<import('../types').Sensor[]>}
 */
export const getSensors = () =>
  api.get('/sensors').then((res) => res.data);

/**
 * Fetch a single sensor by ID.
 * GET /sensors/:id
 * @param {string|number} id
 */
export const getSensorById = (id) =>
  api.get(`/sensors/${id}`).then((res) => res.data);