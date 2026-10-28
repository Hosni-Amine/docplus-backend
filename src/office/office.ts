import type { User } from '../user/entities/user.entity';

export enum OfficeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

/** How the office refers to role USER in the UI. */
export enum CareRecipientLabel {
  PATIENT = 'patient',
  CLIENT = 'client',
}

export enum OfficePlan {
  BASIC = 'basic',
  STARTER = 'starter',
  PREMIUM = 'premium',
}

export enum ContractStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export type ContractDisplayStatus =
  | 'upcoming'
  | 'current'
  | 'expired'
  | 'cancelled';

export type OfficeContract = {
  _id: string;
  officeId: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  displayStatus: ContractDisplayStatus;
  plan?: OfficePlan;
  notes?: string;
  documents?: string[];
};

export type OfficeUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  midNames?: string[];
  email?: string;
  role?: string;
  officeStaffRole?: string | null;
  isOwner?: boolean;
  status?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
};

export type WorkingDayHours = {
  enabled: boolean;
  start: string;
  end: string;
};

export type WorkingHours = {
  monday?: WorkingDayHours;
  tuesday?: WorkingDayHours;
  wednesday?: WorkingDayHours;
  thursday?: WorkingDayHours;
  friday?: WorkingDayHours;
  saturday?: WorkingDayHours;
  sunday?: WorkingDayHours;
};

export type Office = {
  _id: string;
  legalName: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  status?: OfficeStatus;
  careRecipientLabel?: CareRecipientLabel;
  workingHours?: WorkingHours | null;
  officeAdmins?: User[];
  officeUsers?: User[];
  owner?: User | null;
  ownerId?: string | null;
  currentContract?: OfficeContract | null;
  adminsCount?: number;
  usersCount?: number;
  created_at?: string;
};
