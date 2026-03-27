/**
 * seed-utils.ts
 *
 * Utility functions for the seeding process.
 */

/**
 * Generates a stable hashed ID for a player name in range 10000000-99999999.
 */
export function getHashedId(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return 10000000 + (Math.abs(hash) % 90000000);
}
