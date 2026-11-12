/**
 * Field projections for User queries.
 *
 * Keep each set tight: list endpoints feed both the table AND the quick-edit
 * modal (same row object), so list fields = table columns + modal form fields.
 */

/**
 * Staff / user tables + quick-edit modal.
 * Table: name, avatar, email, role/staff role, owner, phone, address, status.
 * Modal: + specialty, isPublic (visibility).
 */
export const listUserFields =
  'email firstName lastName role officeStaffRole specialty isOwner status avatarUrl phone address country state city zipCode officeId isPublic';

/**
 * Nested refs (chat participants, folder/document authors, appointment parties).
 * Enough to render a person chip and send mail preferences when populated.
 */
export const populateUserFields =
  'email firstName lastName avatarUrl phone role officeStaffRole status emailAppointmentReminders emailAppointmentConfirmations';

/**
 * Public clinician profile for landing page & search.
 * Excludes email, bio, languages, experience, home address, and internal notes.
 */
export const publicDoctorFields =
  'firstName lastName officeStaffRole avatarUrl specialty verified officeId';

/**
 * Public office fields populated on public clinician query.
 */
export const publicOfficeFields =
  'legalName service address city state country zipCode lat lng phone email timezone';

/**
 * Full profile: /me, get-by-id, account settings, doctor public card fields.
 */
export const privateUserFields =
  'email firstName lastName midNames role officeStaffRole specialty isOwner status avatarUrl phone address country state city zipCode about notes isPublic emailAppointmentReminders emailAppointmentConfirmations currentWork study officeId languages verified experienceYears';

/** JWT auth context (same as public + tokenVersion). */
export const tokenUserFields = `${privateUserFields} tokenVersion`;
