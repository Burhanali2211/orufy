/** Convert paise (integer) to a formatted ₹ string */
export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}
