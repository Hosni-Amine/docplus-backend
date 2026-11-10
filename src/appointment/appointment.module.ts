import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { UserModule } from '../user/user.module';
import { OfficeModule } from '../office/office.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentService } from './appointment.service';
import { VideoConsultationService } from './video-consultation.service';
import { AppointmentInviteService } from './appointment-invite.service';
import { AppointmentReminderService } from './appointment-reminder.service';
import { Appointment, AppointmentSchema } from './entities/appointment.entity';
import { AppointmentRequestService } from './appointment-request.service';
import { AppointmentRequestRepository } from './appointment-request.repository';
import {
  AppointmentRequest,
  AppointmentRequestSchema,
} from './entities/appointment-request.entity';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    OfficeModule,
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: AppointmentRequest.name, schema: AppointmentRequestSchema },
    ]),
  ],
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    AppointmentRepository,
    VideoConsultationService,
    AppointmentInviteService,
    AppointmentReminderService,
    AppointmentRequestRepository,
    AppointmentRequestService,
  ],
  exports: [
    AppointmentRepository,
    VideoConsultationService,
    AppointmentInviteService,
  ],
})
export class AppointmentModule {}
