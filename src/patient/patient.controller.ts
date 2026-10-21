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
import { CreatePatientInput } from './dto/create-patient.input';
import { UpdatePatientInput } from './dto/update-patient.input';
import {
  GetPatientRes,
  GetPatientsRes,
  PatientService,
} from './patient.service';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: string;
};

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Post()
  async createPatient(
    @Body() input: CreatePatientInput,
    @CurrentUser() user: Actor,
  ): Promise<GetPatientRes> {
    return this.patientService.createPatient(input, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get()
  async getPatients(@CurrentUser() user: Actor): Promise<GetPatientsRes> {
    return this.patientService.getPatients(user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get(':id')
  async getPatientById(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
  ): Promise<GetPatientRes> {
    return this.patientService.getPatientById(id, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('delete/:id')
  async deletePatient(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
  ): Promise<IBaseRes> {
    return this.patientService.deletePatient(id, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch()
  async updatePatient(
    @Body() input: UpdatePatientInput,
    @CurrentUser() user: Actor,
  ): Promise<GetPatientRes> {
    return this.patientService.updatePatient(input, user);
  }
}
