import {
  Get,
  Req,
  Body,
  Post,
  Param,
  Patch,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, RolesGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { Roles } from '../decorators/roles.decorator';
import { ERole, EMeetingStatus } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import {
  GetAppointmentRes,
  GetAppointmentsRes,
  AppointmentService,
} from './appointment.service';
import {
  ConsultationTokenRes,
  VideoConsultationService,
} from './video-consultation.service';
import {
  ExchangeInviteRes,
  AppointmentInviteService,
} from './appointment-invite.service';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: string;
};

@Controller('appointment')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly videoConsultationService: VideoConsultationService,
    private readonly appointmentInviteService: AppointmentInviteService,
  ) { }

  /**
   * Trade an emailed appointment invite for a session token.
   *
   * Public on purpose: this is how an attendee who is not signed in joins
   * their consultation. The invite is signed, bound to one appointment and
   * one attendee, and only works while that room is open.
   */
  @Post('invite/exchange')
  async exchangeInvite(
    @Body('token') token: string,
    @Req() request: Request,
  ): Promise<ExchangeInviteRes> {
    return this.appointmentInviteService.exchange(
      token,
      request.ip || 'unknown',
    );
  }

  /**
   * Resend a fresh appointment invite link to the attendee's email.
   * Public endpoint that accepts the current token to verify appointment identity.
   */
  @Post('invite/resend')
  async resendInvite(
    @Body('token') token: string,
    @Req() request: Request,
  ): Promise<IBaseRes> {
    return this.appointmentInviteService.resendInvite(
      token,
      request.ip || 'unknown',
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id/consultation/token')
  async getConsultationToken(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
  ): Promise<ConsultationTokenRes> {
    return this.videoConsultationService.getConsultationToken(id, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Patch(':id/consultation/status')
  @Roles(ERole.ADMIN)
  async updateConsultationStatus(
    @Param('id') id: string,
    @Body('status') status: EMeetingStatus,
    @CurrentUser() user: Actor,
  ): Promise<IBaseRes> {
    return this.videoConsultationService.updateConsultationStatus(id, status, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Post()
  async createAppointment(
    @Body() input: CreateAppointmentInput,
    @CurrentUser() user: Actor,
  ): Promise<GetAppointmentRes> {
    return this.appointmentService.createAppointment(input, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get()
  async getAppointments(
    @CurrentUser() user: Actor,
  ): Promise<GetAppointmentsRes> {
    return this.appointmentService.getAppointments(user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get(':id')
  async getAppointmentById(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
  ): Promise<GetAppointmentRes> {
    return this.appointmentService.getAppointmentById(id, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('delete/:id')
  async deleteAppointment(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
  ): Promise<IBaseRes> {
    return this.appointmentService.deleteAppointment(id, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch()
  async updateAppointment(
    @Body() input: UpdateAppointmentInput,
    @CurrentUser() user: Actor,
  ): Promise<GetAppointmentRes> {
    return this.appointmentService.updateAppointment(input, user);
  }
}
