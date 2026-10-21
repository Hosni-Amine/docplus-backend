import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentRepository extends AbstractRepository<Appointment> {
  protected readonly logger = new Logger(AppointmentRepository.name);

  constructor(
    @InjectModel(Appointment.name) appointmentModel: Model<Appointment>,
    @InjectConnection() connection: Connection,
  ) {
    super(appointmentModel, connection);
  }
}
