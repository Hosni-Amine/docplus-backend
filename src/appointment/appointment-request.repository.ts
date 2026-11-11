import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { AbstractRepository } from '../common';
import {
  AppointmentRequest,
  EAppointmentRequestStatus,
} from './entities/appointment-request.entity';

@Injectable()
export class AppointmentRequestRepository extends AbstractRepository<AppointmentRequest> {
  protected readonly logger = new Logger(AppointmentRequestRepository.name);

  constructor(
    @InjectModel(AppointmentRequest.name)
    private readonly requestModel: Model<AppointmentRequest>,
    @InjectConnection() connection: Connection,
  ) {
    super(requestModel, connection);
  }

  findPendingForContact(
    adminId: Types.ObjectId,
    email: string,
    phone: string,
  ): Promise<AppointmentRequest[]> {
    const contact: Record<string, string>[] = [{ email }];
    if (phone) contact.push({ phone });
    return this.requestModel
      .find({
        adminId,
        status: EAppointmentRequestStatus.PENDING,
        $or: contact,
      })
      .lean()
      .exec() as Promise<AppointmentRequest[]>;
  }

  deletePendingForContact(
    adminId: Types.ObjectId,
    email: string,
    phone: string,
  ): Promise<void> {
    const contact: Record<string, string>[] = [{ email }];
    if (phone) contact.push({ phone });
    return this.requestModel
      .deleteMany({
        adminId,
        status: EAppointmentRequestStatus.PENDING,
        $or: contact,
      })
      .exec()
      .then(() => undefined);
  }

  countRecentForEmail(email: string, since: Date): Promise<number> {
    return this.requestModel
      .countDocuments({ email, created_at: { $gte: since } })
      .exec();
  }

  listPendingForOffice(
    officeId: Types.ObjectId,
  ): Promise<AppointmentRequest[]> {
    return this.requestModel
      .find({
        officeId,
        status: EAppointmentRequestStatus.PENDING,
      })
      .sort({ created_at: -1 })
      .lean()
      .exec() as Promise<AppointmentRequest[]>;
  }

  markSeen(
    officeId: Types.ObjectId,
    adminId: Types.ObjectId,
    ids?: Types.ObjectId[],
  ): Promise<void> {
    const filter: Record<string, unknown> = {
      officeId,
      status: EAppointmentRequestStatus.PENDING,
    };
    if (ids?.length) {
      filter._id = { $in: ids };
    }
    return this.requestModel
      .updateMany(filter, { $addToSet: { seenBy: adminId } })
      .exec()
      .then(() => undefined);
  }

  declinePending(
    officeId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<AppointmentRequest | null> {
    return this.requestModel
      .findOneAndUpdate(
        {
          _id: id,
          officeId,
          status: EAppointmentRequestStatus.PENDING,
        },
        { status: EAppointmentRequestStatus.DECLINED },
        { new: true },
      )
      .lean()
      .exec() as Promise<AppointmentRequest | null>;
  }
}
