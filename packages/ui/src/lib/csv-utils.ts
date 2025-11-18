/**
 * CSV utility functions for converting arrays to CSV format
 */

/**
 * Converts an array of values to a CSV-formatted string.
 * Handles proper escaping of values containing commas, quotes, or newlines.
 *
 * @param array - The array to convert to CSV format
 * @returns A comma-separated string representation of the array
 *
 * @example
 * ```ts
 * arrayToCsv([1, 2, 3]) // "1, 2, 3"
 * arrayToCsv(["hello", "world"]) // "hello, world"
 * arrayToCsv(["a,b", 'c"d']) // '"a,b", "c""d"'
 * arrayToCsv([null, undefined, ""]) // ", , "
 * ```
 */
export function arrayToCsv(array: unknown[]): string {
  return array
    .map((item) => {
      if (item === null || item === undefined) {
        return "";
      }
      const str = String(item);
      // Quote values containing commas, quotes, or newlines
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(", ");
}
