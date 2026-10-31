import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { populateUserFields } from '../user/user.fields';
import { Appointment } from './entities/appointment.entity';

const appointmentPopulate = [
  { path: 'user', select: populateUserFields },
  { path: 'admin', select: populateUserFields },
];

@Injectable()
export class AppointmentRepository extends AbstractRepository<Appointment> {
  protected readonly logger = new Logger(AppointmentRepository.name);

  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    @InjectConnection() connection: Connection,
  ) {
    super(appointmentModel, connection);
  }

  findWithUser(filterQuery: FilterQuery<Appointment>): Promise<Appointment[]> {
    return this.appointmentModel
      .find(filterQuery)
      .populate(appointmentPopulate)
      .lean({ virtuals: true });
  }

  findOneWithUser(
    filterQuery: FilterQuery<Appointment>,
  ): Promise<Appointment | null> {
    return this.appointmentModel
      .findOne(filterQuery)
      .populate(appointmentPopulate)
      .lean({ virtuals: true });
  }
}
