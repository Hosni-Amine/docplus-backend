import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Post,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, RolesGuard } from '@src/guards';
import { CurrentUser } from '@src/decorators';
import { User } from './entities/user.entity';
import { ERole, GetUserRes } from '@app/common';
import { Roles } from '@src/decorators/roles.decorator';
import { GetUsersPaginator } from './dto/get-users-input';
import { GetUsersInput } from './dto/get-users-input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update.user.input';
import { Response } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@CurrentUser() user: User): Promise<GetUserRes> {
    if (user) {
      return {
        message: 'USER_FOUND_SUCCESSFULLY',
        status: 200,
        user,
      };
    } else {
      return {
        message: 'USER_NOT_FOUND',
        status: 404,
        user: null,
      };
    }
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(ERole.ADMIN, ERole.DOCTOR, ERole.SECRETARY)
  // TODO : ADD ROLES GUARD AFTER TEST
  @Post()
  async createUser(
    @Body() createUserInput: CreateUserInput,
    @Res() response: Response,
  ) {
    const res = await this.userService.createUser(createUserInput);
    return response.status(res.status).send({
      ...res,
    });
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN, ERole.DOCTOR, ERole.SECRETARY)
  @Patch()
  async updateUser(
    @Body() updateUserInput: UpdateUserInput,
    @Res() response: Response,
  ) {
    const res = await this.userService.updateUser(updateUserInput);
    return response.status(res.status).send({
      ...res,
    });
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN, ERole.SECRETARY, ERole.DOCTOR)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Res() response: Response) {
    const res = await this.userService.deleteUser(id);
    return response.status(res.status).send({
      ...res,
    });
  }

  @UseGuards(AuthGuard)
  @Get()
  async getUsers(
    @Body() getUsersInput: GetUsersInput,
  ): Promise<GetUsersPaginator> {
    return await this.userService.getUsers(getUsersInput);
  }
}
