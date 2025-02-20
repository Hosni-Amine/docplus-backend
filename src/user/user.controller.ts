import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, RolesGuard } from '@src/guards';
import { CurrentUser } from '@src/decorators';
import { User } from './schemas/user.schema';
import { ERole, GetUserResDTO } from '@app/common';
import { Roles } from '@src/decorators/roles.decorator';
import { GetUserInput } from './dto/get-users-input';
import { CreateUserDTO, GetUsersResDTO, UpdateUserDTO } from './dto/user.dto';
import { Response } from 'express';
import { MailingService } from '@src/mailing/mailing.service';
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly mailingService: MailingService
  ) { }

  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@CurrentUser() user: User) : Promise<GetUserResDTO> {
    this.mailingService.sendUserResetPassword('amine.hosni02@gmail.com', 'amine hosni', '1234567890')
    this.mailingService.sendUserConfirmation('amine.hosni02@gmail.com', 'amine hosni', '1234567890')
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
  @Roles(ERole.ADMIN,ERole.DOCTOR,ERole.SECRETARY)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDTO, @Res() response : Response){
    const res = await this.userService.createUser(createUserDto);
    return response.status(res.status).send({
      ...res
    })
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN,ERole.DOCTOR,ERole.SECRETARY)
  async updateUser(
    @Body() updateUserDto: UpdateUserDTO,
    @Res() response : Response
  ) {
    const res = await this.userService.updateUser(updateUserDto);
    return response.status(res.status).send({
      ...res
    })
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN,ERole.SECRETARY,ERole.DOCTOR)
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @Res() response : Response
  ) {
    const res = await this.userService.deleteUser(id);
    return response.status(res.status).send({
      ...res
    })
  }

  @UseGuards(AuthGuard)
  @Get()
  async getUsers(
    @Body() getUserInput: GetUserInput
  ): Promise<GetUsersResDTO>{
    return await this.userService.getUsers(getUserInput);
  }

}
