import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Post,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, RolesGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { User } from './entities/user.entity';
import { GetUsersPaginator } from './dto/get-users-input';
import { GetUsersInput } from './dto/get-users-input';
import { CreateUserInput } from './dto/create-user.input';
import { ChangeOwnershipInput } from './dto/change-ownership.input';
import { UpdateUserInput } from './dto/update.user.input';
import { IBaseRes } from '../common/responses.dto';
import { ECareRecipientLabel, ERole } from '../common/enums';
import { Roles } from '../decorators/roles.decorator';

export interface GetUserRes extends IBaseRes {
  user: User;
}

export type MeUser = User & {
  legalName?: string;
  careRecipientLabel?: ECareRecipientLabel;
};

export interface GetMeRes extends IBaseRes {
  user: MeUser | null;
}

export interface GetAllUsersRes extends IBaseRes {
  users: User[];
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@CurrentUser() user: MeUser): Promise<GetMeRes> {
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

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Post('create-admin')
  async createAdminSuperAdmin(
    @Body() createUserInput: CreateUserInput,
  ): Promise<IBaseRes> {
    return await this.userService.createAdminSuperAdmin(createUserInput);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Post('create-user')
  async createUser(
    @Body() createUserInput: CreateUserInput,
    @CurrentUser() user: User,
  ): Promise<IBaseRes> {
    return await this.userService.createUser(createUserInput, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN, ERole.SUPER_ADMIN)
  @Patch()
  async updateUser(
    @Body() updateUserInput: UpdateUserInput,
    @CurrentUser() user: User,
  ): Promise<IBaseRes> {
    return await this.userService.updateUser(updateUserInput, user);
  }

  /** Super admin only: set or clear isOwner on an office ADMIN. */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Patch('ownership')
  async changeOwnership(
    @Body() input: ChangeOwnershipInput,
  ): Promise<IBaseRes> {
    return await this.userService.changeOwnership(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN, ERole.SUPER_ADMIN)
  @Post('with-pagination')
  async getUsersWithPagination(
    @Body() getUsersInput: GetUsersInput,
  ): Promise<GetUsersPaginator> {
    return await this.userService.getUsersWithPagination(getUsersInput);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Get('admins')
  async getAllAdmins(): Promise<GetAllUsersRes> {
    return await this.userService.getAllAdmins();
  }

  /** Office admins (role ADMIN). */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get('office-admins')
  async getOfficeAdmins(
    @CurrentUser() currentUser: User,
  ): Promise<GetAllUsersRes> {
    if (!currentUser.officeId) {
      return { users: [], status: 403, message: 'OFFICE_REQUIRED' };
    }
    return await this.userService.getOfficeAdmins(
      currentUser.officeId.toString(),
    );
  }

  /** Office users (role USER). */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get()
  async getOfficeUsers(
    @CurrentUser() currentUser: User,
  ): Promise<GetAllUsersRes> {
    if (!currentUser.officeId) {
      return { users: [], status: 403, message: 'OFFICE_REQUIRED' };
    }
    return await this.userService.getOfficeUsers(
      currentUser.officeId.toString(),
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<GetUserRes> {
    return await this.userService.getUserById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN, ERole.ADMIN)
  @Patch('delete/:id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<IBaseRes> {
    return await this.userService.deleteUser(id, user);
  }
}
