// TEMPORARY: Developer testing override
// Set to false to disable this override
export const ENABLE_PREMIUM_OVERRIDE = true;

/**
 * Grants Premium access to specific accounts for testing purposes.
 * This overrides the database value in-memory during requests.
 * @param {Object} user - The user object from the database
 * @returns {Object} - The potentially modified user object
 */
export function applyDeveloperOverride(user) {
  if (!user) return user;
  
  if (ENABLE_PREMIUM_OVERRIDE && user.name && user.name.toLowerCase() === 'shivam') {
    user.tier = 'premium';
  }
  
  return user;
}
