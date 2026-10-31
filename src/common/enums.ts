export enum ERole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/** Clinical / medical role of an office staff member (ADMIN). */
export enum EOfficeStaffRole {
  DOCTOR = 'doctor',
  TECHNICIAN = 'technician',
  SECRETARY = 'secretary',
  WORKER = 'worker',
}

/** Medical specialties a staff member may declare (multi-select). */
export enum EMedicalSpecialty {
  GENERAL_PRACTICE = 'general_practice',
  RADIOLOGY = 'radiology',
  THERAPY = 'therapy',
  PHYSIOTHERAPY = 'physiotherapy',
  PSYCHOTHERAPY = 'psychotherapy',
  SPEECH_THERAPY = 'speech_therapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  DENTAL = 'dental',
  OPHTHALMOLOGY = 'ophthalmology',
  DERMATOLOGY = 'dermatology',
  CARDIOLOGY = 'cardiology',
  PEDIATRICS = 'pediatrics',
  GYNECOLOGY = 'gynecology',
  OBSTETRICS = 'obstetrics',
  ORTHOPEDICS = 'orthopedics',
  OTORHINOLARYNGOLOGY = 'otorhinolaryngology',
  NEUROLOGY = 'neurology',
  PSYCHIATRY = 'psychiatry',
  ONCOLOGY = 'oncology',
  UROLOGY = 'urology',
  GASTROENTEROLOGY = 'gastroenterology',
  PULMONOLOGY = 'pulmonology',
  ENDOCRINOLOGY = 'endocrinology',
  RHEUMATOLOGY = 'rheumatology',
  NEPHROLOGY = 'nephrology',
  SURGERY = 'surgery',
  PLASTIC_SURGERY = 'plastic_surgery',
  ANESTHESIOLOGY = 'anesthesiology',
  EMERGENCY = 'emergency',
  OSTEOPATHY = 'osteopathy',
  CHIROPRACTIC = 'chiropractic',
  ACUPUNCTURE = 'acupuncture',
  NUTRITION = 'nutrition',
  MIDWIFERY = 'midwifery',
  PODIATRY = 'podiatry',
  ALLERGOLOGY = 'allergology',
  INFECTIOUS_DISEASE = 'infectious_disease',
  GERIATRICS = 'geriatrics',
  PALLIATIVE_CARE = 'palliative_care',
  SPORTS_MEDICINE = 'sports_medicine',
  AESTHETIC_MEDICINE = 'aesthetic_medicine',
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

/** Medical office / facility / department type. */
export enum EOfficeService {
  HOSPITAL = 'hospital',
  CLINIC = 'clinic',
  MEDICAL_CABINET = 'medical_cabinet',
  MEDICAL_CENTER = 'medical_center',
  POLYCLINIC = 'polyclinic',
  PRIVATE_PRACTICE = 'private_practice',
  URGENT_CARE = 'urgent_care',
  AMBULATORY_SURGERY_CENTER = 'ambulatory_surgery_center',
  REHABILITATION_CENTER = 'rehabilitation_center',
  NURSING_HOME = 'nursing_home',
  HOME_CARE = 'home_care',
  TELEMEDICINE = 'telemedicine',
  LABORATORY = 'laboratory',
  PHARMACY = 'pharmacy',
  IMAGING_CENTER = 'imaging_center',
  DIALYSIS_CENTER = 'dialysis_center',
  BLOOD_DONATION_CENTER = 'blood_donation_center',
  VACCINATION_CENTER = 'vaccination_center',
  WELLNESS_CENTER = 'wellness_center',
  MULTIDISCIPLINARY_CLINIC = 'multidisciplinary_clinic',
  GENERAL_PRACTICE = 'general_practice',
  RADIOLOGY = 'radiology',
  THERAPY = 'therapy',
  PHYSIOTHERAPY = 'physiotherapy',
  PSYCHOTHERAPY = 'psychotherapy',
  SPEECH_THERAPY = 'speech_therapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  DENTAL = 'dental',
  OPHTHALMOLOGY = 'ophthalmology',
  DERMATOLOGY = 'dermatology',
  CARDIOLOGY = 'cardiology',
  PEDIATRICS = 'pediatrics',
  GYNECOLOGY = 'gynecology',
  OBSTETRICS = 'obstetrics',
  ORTHOPEDICS = 'orthopedics',
  OTORHINOLARYNGOLOGY = 'otorhinolaryngology',
  NEUROLOGY = 'neurology',
  PSYCHIATRY = 'psychiatry',
  ONCOLOGY = 'oncology',
  UROLOGY = 'urology',
  GASTROENTEROLOGY = 'gastroenterology',
  PULMONOLOGY = 'pulmonology',
  ENDOCRINOLOGY = 'endocrinology',
  RHEUMATOLOGY = 'rheumatology',
  NEPHROLOGY = 'nephrology',
  SURGERY = 'surgery',
  PLASTIC_SURGERY = 'plastic_surgery',
  ANESTHESIOLOGY = 'anesthesiology',
  EMERGENCY = 'emergency',
  OSTEOPATHY = 'osteopathy',
  CHIROPRACTIC = 'chiropractic',
  ACUPUNCTURE = 'acupuncture',
  NUTRITION = 'nutrition',
  MIDWIFERY = 'midwifery',
  PODIATRY = 'podiatry',
  ALLERGOLOGY = 'allergology',
  INFECTIOUS_DISEASE = 'infectious_disease',
  GERIATRICS = 'geriatrics',
  PALLIATIVE_CARE = 'palliative_care',
  SPORTS_MEDICINE = 'sports_medicine',
  AESTHETIC_MEDICINE = 'aesthetic_medicine',
}

export enum EOfficePlan {
  BASIC = 'basic',
  STARTER = 'starter',
  PREMIUM = 'premium',
}

export enum EContractStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

export enum EMeetingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum EConsultationType {
  IN_OFFICE = 'in_office',
  VIDEO = 'video',
  PHONE = 'phone',
  HOME_VISIT = 'home_visit',
}
