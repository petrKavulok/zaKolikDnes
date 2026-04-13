// Format an ISO date string (YYYY-MM-DD) or a datetime ("YYYY-MM-DD HH:MM:SS")
// into DD-MM-YYYY for display. Returns the original input if it can't be parsed.
export function formatDate(input: string | null | undefined): string {
  if (!input) return '';
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return input;
  const [, y, m, d] = match;
  return `${d}-${m}-${y}`;
}
