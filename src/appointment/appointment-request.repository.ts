import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { AppointmentRequest } from './entities/appointment-request.entity';

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

  countRecentForEmail(email: string, since: Date): Promise<number> {
    return this.requestModel
      .countDocuments({ email, created_at: { $gte: since } })
      .exec();
  }
}
