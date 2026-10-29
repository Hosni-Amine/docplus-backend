import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { UserModule } from '../user/user.module';
import { OfficeModule } from '../office/office.module';
import { MailingService } from '../mailing/mailing.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentService } from './appointment.service';
import { VideoConsultationService } from './video-consultation.service';
import { AppointmentInviteService } from './appointment-invite.service';
import { Appointment, AppointmentSchema } from './entities/appointment.entity';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    OfficeModule,
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    AppointmentRepository,
    VideoConsultationService,
    AppointmentInviteService,
    MailingService,
  ],
  exports: [
    AppointmentRepository,
    VideoConsultationService,
    AppointmentInviteService,
  ],
})
export class AppointmentModule {}
