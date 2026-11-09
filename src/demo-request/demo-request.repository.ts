import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AbstractRepository } from '../common';
import { DemoRequest } from './entities/demo-request.entity';

@Injectable()
export class DemoRequestRepository extends AbstractRepository<DemoRequest> {
  protected readonly logger = new Logger(DemoRequestRepository.name);

  constructor(
    @InjectModel(DemoRequest.name)
    private readonly demoRequestModel: Model<DemoRequest>,
    @InjectConnection() connection: Connection,
  ) {
    super(demoRequestModel, connection);
  }
}
