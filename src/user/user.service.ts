import { Injectable, Logger } from '@nestjs/common';
import { ERole, handleFileUpload } from '../common';
import { GetUsersInput, GetUsersPaginator } from './dto/get-users-input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update.user.input';
import { MailingService } from '../mailing/mailing.service';
import { UserRepository } from './user.repository';
import { GetAllUsersRes, GetUserRes } from './user.controller';
import { toPublicUser } from './public-user';
import { User } from './entities/user.entity';

type Actor = {
  id?: string;
  role?: ERole;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly mailingService: MailingService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Create a user and send a welcome email when an address is present.
   */
  async createUser(createUserInput: CreateUserInput): Promise<GetUserRes> {
    try {
      if (
        createUserInput.email &&
        (await this.emailTaken(createUserInput.email))
      ) {
        this.logger.error(
          `This mail address ${createUserInput.email} is already existed!`,
        );
        return this.result(400, 'EMAIL_ALREADY_EXISTED');
      }

      const { role, ...rest } = createUserInput;
      const newUser = await this.userRepository.create({
        ...rest,
        isBlocked: false,
        role: role as ERole,
      });

      if (newUser.email) {
        await this.mailingService.sendWelcomeEmail(
          newUser.email,
          newUser.fullname,
        );
      }

      return this.result(201, 'USER_CREATED_SUCCESSFULLY', newUser);
    } catch (error) {
      this.logger.error(error);
      return this.result(500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Update a profile. Role, block, and delete changes are admin-only.
   * Other users can update only their own profile.
   */
  async updateUser(
    updateUserInput: Partial<UpdateUserInput>,
    actor: Actor,
  ): Promise<GetUserRes> {
    try {
      const { id, photo, role, isBlocked, isDeleted, ...rest } =
        updateUserInput;
      const isAdmin =
        actor?.role === ERole.ADMIN || actor?.role === ERole.SUPER_ADMIN;

      if (!isAdmin && id !== actor?.id) {
        return this.result(403, 'FORBIDDEN');
      }

      const existingUser = await this.userRepository.findOne({ _id: id });
      if (!existingUser) {
        this.logger.error(`User with ID ${id} not found`);
        return this.result(404, 'USER_NOT_FOUND');
      }

      if (rest.email && (await this.emailTaken(rest.email, id))) {
        this.logger.error(`This mail address ${rest.email} is already in use`);
        return this.result(400, 'EMAIL_ALREADY_IN_USE');
      }

      const updates: Partial<User> = { ...rest };

      if (isAdmin) {
        if (role) updates.role = role as ERole;
        if (typeof isBlocked === 'boolean') updates.isBlocked = isBlocked;
        if (typeof isDeleted === 'boolean') updates.isDeleted = isDeleted;
      }

      const accessChanged =
        (updates.email !== undefined && updates.email !== existingUser.email) ||
        (updates.role !== undefined && updates.role !== existingUser.role) ||
        updates.isBlocked === true ||
        updates.isDeleted === true;

      if (accessChanged) {
        updates.tokenVersion = (existingUser.tokenVersion ?? 0) + 1;
      }

      if (photo) {
        updates.photo = await handleFileUpload(photo, 'users');
      }

      const updatedUser = await this.userRepository.findOneAndUpdate(
        { _id: id },
        updates,
      );

      return this.result(200, 'USER_UPDATED_SUCCESSFULLY', updatedUser);
    } catch (error) {
      this.logger.error(error);
      return this.result(500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Return a page of users matching the given filters.
   */
  async getUsersWithPagination(
    getUserInput: GetUsersInput,
  ): Promise<GetUsersPaginator> {
    try {
      const { fullname, role, isDeleted, limit = 10, skip = 0 } = getUserInput;
      const query: Record<string, unknown> = {
        isDeleted: isDeleted || false,
      };

      if (role) {
        query.role = role;
      }
      if (fullname) {
        query.fullname = { $regex: fullname, $options: 'i' };
      }

      return await this.userRepository.getWithPagination(query, {
        limit,
        skip,
        sort: { fullname: -1 },
        select: 'fullname email role photo phone address',
      });
    } catch (error) {
      this.logger.error('Error getting users:', error);
      return emptyUsersPage(getUserInput.limit || 10);
    }
  }

  /**
   * Return every user that is not deleted, without OTP fields.
   */
  async getAllUsers(): Promise<GetAllUsersRes> {
    try {
      const users = await this.userRepository.find({ isDeleted: false });
      return {
        users: users.map((user) => toPublicUser(user)),
        status: 200,
        message: 'USERS_FOUND_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error getting users:', error);
      return {
        users: [],
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }

  /**
   * Return one user by id, without OTP fields.
   */
  async getUserById(id: string): Promise<GetUserRes> {
    try {
      const user = await this.userRepository.findOne({ _id: id });
      if (!user) {
        return this.result(404, 'USER_NOT_FOUND');
      }
      return this.result(200, 'USER_FOUND', user);
    } catch (error) {
      this.logger.error('Error getting user by id:', error);
      return this.result(500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * True when another user already owns this email.
   */
  private async emailTaken(email: string, exceptId?: string): Promise<boolean> {
    const existing = await this.userRepository.findOne({
      email,
      ...(exceptId && { _id: { $ne: exceptId } }),
    });
    return !!existing;
  }

  /**
   * Build a single-user response and strip private fields.
   */
  private result(
    status: number,
    message: string,
    user?: User | null,
  ): GetUserRes {
    return {
      status,
      message,
      user: toPublicUser(user ?? null),
    };
  }
}

/**
 * Empty page returned when a user search fails.
 */
function emptyUsersPage(limit: number): GetUsersPaginator {
  return {
    data: [],
    paginatorInfo: {
      count: 0,
      currentPage: 1,
      perPage: limit,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
    },
  };
}
