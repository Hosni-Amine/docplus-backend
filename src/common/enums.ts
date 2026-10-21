export enum ERole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum EUserStatus {
  ACTIVE = 'active',
  PENDING_APPROVAL = 'pending_approval',
  DISABLED = 'disabled',
  DELETED = 'deleted',
}

export enum EOfficeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

/** UI label for role USER (therapy patient vs advocate client). */
export enum ECareRecipientLabel {
  PATIENT = 'patient',
  CLIENT = 'client',
}
