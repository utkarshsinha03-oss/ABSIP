import api from './axios';

/**
 * Fetch all sectors ranked by threat score (highest first).
 * GET /ranked-sectors
 */
export const getRankedSectors = () =>
  api.get('/ranked-sectors').then((res) => res.data);

/**
 * Fetch the top N highest-threat sectors.
 * GET /top-threats
 * @param {number} [limit=5]
 */
export const getTopThreats = (limit = 5) =>
  api.get('/top-threats', { params: { limit } }).then((res) => res.data);

/**
 * Fetch the recommended patrol dispatch plan.
 * GET /patrol-assignments
 */
export const getPatrolAssignments = () =>
  api.get('/patrol-assignments').then((res) => res.data);

/**
 * Fetch all sectors with their current threat data.
 * GET /sectors
 */
export const getAllSectors = () =>
  api.get('/sectors').then((res) => res.data);
