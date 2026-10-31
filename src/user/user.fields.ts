/**
 * Lightweight fields for user list endpoints (tables, pickers).
 */
export const listUserFields =
  'email firstName lastName midNames role officeStaffRole specialty isOwner status avatarUrl phone address country state city zipCode officeId isPublic';

/**
 * Full profile fields for /me, get by id, and auth context.
 */
export const publicUserFields =
  'email firstName lastName midNames role officeStaffRole specialty isOwner status avatarUrl phone address country state city zipCode about notes isPublic emailAppointmentReminders emailAppointmentConfirmations currentWork study officeId';

export const tokenUserFields = `${publicUserFields} tokenVersion`;
