/** Doctor title used in notifications and appointment emails. */
export function withDoctorTitle(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || /^dr\.?\s/i.test(trimmed)) return trimmed;
  return `Dr. ${trimmed}`;
}

export function doctorDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = 'Doctor',
): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (!name) return fallback;
  return withDoctorTitle(name);
}
