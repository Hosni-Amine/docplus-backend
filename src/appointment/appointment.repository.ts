import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
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

  findBusyRanges(
    adminId: Types.ObjectId,
    start: Date,
    end: Date,
    excludeAppointmentId?: Types.ObjectId,
  ): Promise<Array<Pick<Appointment, 'start' | 'end'>>> {
    return this.appointmentModel
      .find({
        adminId,
        isDeleted: false,
        start: { $lt: end },
        end: { $gt: start },
        ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
      })
      .select({ _id: 0, start: 1, end: 1 })
      .lean()
      .exec() as Promise<Array<Pick<Appointment, 'start' | 'end'>>>;
  }
}
