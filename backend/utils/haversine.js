/**
 * Haversine formula to compute great-circle distance between two GPS coordinates
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in meters
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a volunteer's check-in location is within the allowed radius of the opportunity
 * @param {Object} checkInCoords - { latitude, longitude }
 * @param {Object} opportunityCoords - { latitude, longitude }
 * @param {number} radiusMeters - Allowed radius (default: 200m)
 * @returns {{ valid: boolean, distance: number }}
 */
const isWithinRadius = (checkInCoords, opportunityCoords, radiusMeters = 200) => {
  if (!checkInCoords?.latitude || !opportunityCoords?.latitude) {
    return { valid: false, distance: null, error: 'Missing coordinates' };
  }
  const distance = haversineDistance(
    checkInCoords.latitude,
    checkInCoords.longitude,
    opportunityCoords.latitude,
    opportunityCoords.longitude
  );
  return { valid: distance <= radiusMeters, distance: Math.round(distance), radiusMeters };
};

module.exports = { haversineDistance, isWithinRadius };
