/**
 * Lightweight fields for user list endpoints (tables, pickers).
 */
export const listUserFields =
  'email firstName lastName midNames role status avatarUrl phone address country state city zipCode officeId';

/**
 * Full profile fields for /me, get by id, and auth context.
 */
export const publicUserFields =
  'email firstName lastName midNames role status avatarUrl phone address country state city zipCode about notes isPublic currentWork study officeId';

export const tokenUserFields = `${publicUserFields} tokenVersion`;
