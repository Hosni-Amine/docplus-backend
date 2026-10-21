import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ERole } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { CreatePatientInput } from './dto/create-patient.input';
import { UpdatePatientInput } from './dto/update-patient.input';
import { Patient } from './entities/patient.entity';
import { PatientRepository } from './patient.repository';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: { toString(): string } | string;
};

export interface GetPatientRes extends IBaseRes {
  patient: Patient | null;
}

export interface GetPatientsRes extends IBaseRes {
  patients: Patient[];
}

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(private readonly patientRepository: PatientRepository) {}

  /**
   * Create a patient in the actor's office.
   */
  async createPatient(
    input: CreatePatientInput,
    actor: Actor,
  ): Promise<GetPatientRes> {
    try {
      if (!actor.officeId) {
        return { status: 403, message: 'OFFICE_REQUIRED', patient: null };
      }

      const patient = await this.patientRepository.create({
        ...input,
        officeId: new Types.ObjectId(actor.officeId.toString()),
        isDeleted: false,
      });
      return { status: 201, message: 'PATIENT_CREATED_SUCCESSFULLY', patient };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', patient: null };
    }
  }

  /**
   * Return every patient of the actor's office.
   */
  async getPatients(actor: Actor): Promise<GetPatientsRes> {
    try {
      if (!actor.officeId) {
        return { status: 403, message: 'OFFICE_REQUIRED', patients: [] };
      }

      const patients = await this.patientRepository.find({
        officeId: actor.officeId,
        isDeleted: false,
      });
      return { status: 200, message: 'PATIENTS_FOUND_SUCCESSFULLY', patients };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', patients: [] };
    }
  }

  /**
   * Return one patient when it belongs to the actor's office.
   */
  async getPatientById(id: string, actor: Actor): Promise<GetPatientRes> {
    try {
      const patient = await this.patientRepository.findOne({ _id: id });
      if (!patient) {
        return { status: 404, message: 'PATIENT_NOT_FOUND', patient: null };
      }
      if (!this.canAccess(actor, patient.officeId.toString())) {
        return { status: 403, message: 'FORBIDDEN', patient: null };
      }
      return { status: 200, message: 'PATIENT_FOUND_SUCCESSFULLY', patient };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', patient: null };
    }
  }

  /**
   * Update a patient in the actor's office.
   */
  async updatePatient(
    input: UpdatePatientInput,
    actor: Actor,
  ): Promise<GetPatientRes> {
    try {
      const existing = await this.patientRepository.findOne({ _id: input.id });
      if (!existing) {
        return { status: 404, message: 'PATIENT_NOT_FOUND', patient: null };
      }
      if (!this.canAccess(actor, existing.officeId.toString())) {
        return { status: 403, message: 'FORBIDDEN', patient: null };
      }

      const { id, ...updates } = input;
      const patient = await this.patientRepository.findOneAndUpdate(
        { _id: id },
        updates,
      );
      return {
        status: 200,
        message: 'PATIENT_UPDATED_SUCCESSFULLY',
        patient: patient ?? null,
      };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', patient: null };
    }
  }

  /**
   * Mark a patient deleted. The record stays.
   */
  async deletePatient(id: string, actor: Actor): Promise<IBaseRes> {
    try {
      const existing = await this.patientRepository.findOne({ _id: id });
      if (!existing) {
        return { status: 404, message: 'PATIENT_NOT_FOUND' };
      }
      if (!this.canAccess(actor, existing.officeId.toString())) {
        return { status: 403, message: 'FORBIDDEN' };
      }

      await this.patientRepository.findOneAndUpdate(
        { _id: id },
        { isDeleted: true },
      );
      return { status: 200, message: 'PATIENT_DELETED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  private canAccess(actor: Actor, officeId: string): boolean {
    if (actor.role === ERole.SUPER_ADMIN) {
      return true;
    }
    return actor.officeId?.toString() === officeId;
  }
}
