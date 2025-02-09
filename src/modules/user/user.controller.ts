import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Res, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@src/guards';
import { CurrentUser } from '@src/decorators';
import { User } from '@src/schemas';
import { GetMeResDTO, GetUserResDTO } from '@app/common';
import { CreatePatientDTO } from './dto/patient.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(AuthGuard)

  @Get('me')
  async findMe(@CurrentUser() user: User) : Promise<GetMeResDTO> {
    if(user)
    {
      return {
        message: 'User founded successfully!',
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

  @Post('patient')
  async createPatient(@Body() createPatientDto: CreatePatientDTO) : Promise<GetUserResDTO> {
      return await this.userService.createPatient(createPatientDto);
  }

  /* @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() response: Response<GetUserResDTO>) {
    try {
      const user = await this.userService.findOne(id);
      return response.status(200).send({
        message: 'User founded successfully!',
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
