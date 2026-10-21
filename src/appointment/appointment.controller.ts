import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { AuthGuard, RolesGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { Roles } from '../decorators/roles.decorator';
import { ERole } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import {
  GetAppointmentRes,
  GetAppointmentsRes,
  AppointmentService,
} from './appointment.service';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: string;
};

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

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
