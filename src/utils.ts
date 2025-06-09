/**
 * Compares two UUIDs case-insensitively
 * @param uuid1 - First UUID to compare
 * @param uuid2 - Second UUID to compare
 * @returns True if UUIDs match (case-insensitive)
 */
export const matchUUID = (uuid1: string, uuid2: string) => uuid1.toUpperCase() === uuid2.toUpperCase();
