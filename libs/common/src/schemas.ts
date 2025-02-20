import { EAppointmentStatus, EBillingStatus, ERole } from "@app/common";


interface IBase {
    id?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface IUser extends IBase {
    email: string;
    password: string;
    phone: string;
    fullname?: string;
    role: ERole;
    doctor_id?: string;
    doctor?: IDoctor;
    secretary_id?: string;
    secretary?: ISecretary;
    patient_id?: string;
    patient?: IPatient;
}

export interface IDoctor extends IBase {
    speciality: string;
    user_id?: string;
    user?: IUser;
    secretaries_ids?: string[];
    secretaries?: ISecretary[];
    thumbnail?: string;
    location_address?: string;
    bio?: string;
    description?: string;
    appointments_ids: string[];
    appointments?: IAppointment[];
    billings_ids: string[];
    billings?: IBilling[];
}

export interface ISecretary extends IBase {
    doctor_id?: string;
    doctor?: IDoctor;
    user_id?: string;
    user?: IUser;
    bio?: string;
    thumbnail?: string;
}

export interface IPatient extends IBase {
    medical_histories_ids?: string[];
    medical_histories?: IMedicalHistory[];
    medical_information_id?: string;
    medical_information?: IMedicalInformation;
    appointments_ids?: string[];
    appointments?: IAppointment[];
    billings?: IBilling[];
    billings_ids?: string[];
    thumbnail?: string;
    user_id?: string;
    user?: IUser;
    doctor_id?: string;
    doctor?: IDoctor;
}


export interface IAppointment extends IBase {
    patient_id?: string;
    patient?: IPatient;
    doctor_id?: string;
    doctor?: IDoctor;
    date: Date;
    status: EAppointmentStatus;
}

export interface IBilling extends IBase {
    patient_id?: string;
    patient?: IPatient;
    doctor_id?: string;
    doctor?: IDoctor;
    ammount: number;
    due_date: Date;
    status: EBillingStatus
}

export interface IMedicalInformation extends IBase {
    insurance_provider?: string;
    insurance_policy_num?: string;
    allergies: string[];
    current_medication: string[];
    family_medical_history: string;
    past_medical_history: string;
    patient: IPatient;
    patient_id: string;
}

export interface IMedicalHistory extends IBase {
    patient_id?: string;
    patient?: IPatient;
    appointment: Date;
    description: string;
    documents?: string[]
}

export interface IEfile extends IBase {
    file_title: string;
    file_type: string;
    file_name: string;
    original_name: string;
    file_size: number;
    url: string;
}