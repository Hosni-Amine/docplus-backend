import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common';
import { MailingModule } from '../mailing/mailing.module';
import { GuardsModule } from '../guards/guards.module';
import { DemoRequest, DemoRequestSchema } from './entities/demo-request.entity';
import { DemoRequestRepository } from './demo-request.repository';
import { DemoRequestService } from './demo-request.service';
import { DemoRequestController } from './demo-request.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DemoRequest.name, schema: DemoRequestSchema },
    ]),
    CommonModule,
    MailingModule,
    GuardsModule,
  ],
  controllers: [DemoRequestController],
  providers: [DemoRequestService, DemoRequestRepository],
  exports: [DemoRequestService, DemoRequestRepository],
})
export class DemoRequestModule {}

