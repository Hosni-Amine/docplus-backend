import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Res, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, RolesGuard } from '@src/guards';
import { CurrentUser } from '@src/decorators';
import { User } from '@src/schemas';
import { ERole, GetMeResDTO, GetUserResDTO } from '@app/common';
import { CreatePatientDTO } from './dto/patient.dto';
import { CreateDoctorDTO } from './dto/doctor.dto';
import { CreateSecretaryDTO } from './dto/secretary.dto';
import { Roles } from '@src/decorators/roles.decorator';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@CurrentUser() user: User) : Promise<GetMeResDTO> {
    if(user)
    {
      return {
        message: 'User found successfully!',
        status: 200,
        user
      };
    }
    else
    {
      return {
        message: 'User not found!',
        status: 404,
        user: null
      };
    }

  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SECRETARY, ERole.DOCTOR)
  @Post('patient')
  async createPatient(@Body() createPatientDto: CreatePatientDTO) : Promise<GetUserResDTO> {
    const patientData = {
      ...createPatientDto,
      role: ERole.PATIENT
    };
    return await this.userService.createPatient(patientData);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Post('doctor')
  async createDoctor(@Body() createDoctorDto: CreateDoctorDTO) : Promise<GetUserResDTO> {
      return await this.userService.createDoctor(createDoctorDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.DOCTOR)
  @Post('secretary')
  async createSecretary(@Body() createSecretaryDto: CreateSecretaryDTO) : Promise<GetUserResDTO> {
      return await this.userService.createSecretary(createSecretaryDto);
  }





  /* @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() response: Response<GetUserResDTO>) {
    try {
      const user = await this.userService.findOne(id);
      return response.status(200).send({
        message: 'User found successfully!',
        status: 200,
        user
      });
    } catch (error) {
      console.log(error);
      return response.status(500).send({
        message: 'Error finding user!',
        status: 500,
        user: null
      });
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  } */
}
