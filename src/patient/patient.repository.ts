import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { Patient } from './entities/patient.entity';

@Injectable()
export class PatientRepository extends AbstractRepository<Patient> {
  protected readonly logger = new Logger(PatientRepository.name);

  constructor(
    @InjectModel(Patient.name) patientModel: Model<Patient>,
    @InjectConnection() connection: Connection,
  ) {
    super(patientModel, connection);
  }
}
