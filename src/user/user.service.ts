import { Injectable, Logger } from '@nestjs/common';
import { ERole, handleFileUpload } from '../common';
import { GetUsersPaginator } from './dto/get-users-input';
import { GetUsersInput } from './dto/get-users-input';
import { CreateUserInput } from './dto/create-user.input';
import {
  AffectUserToOfficeInput,
  UpdateUserInput,
} from './dto/update.user.input';
import { MailingService } from '../mailing/mailing.service';
import { UserRepository } from './user.repository';
import { GetUserRes } from './user.controller';
import { Types } from 'mongoose';
import { OfficeRepository } from '../office/office.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly mailingService: MailingService,
    private readonly userRepository: UserRepository,
    private readonly officeRepository: OfficeRepository,
  ) {}
  private readonly logger = new Logger(UserService.name);

  async createUser(createUserInput: CreateUserInput): Promise<GetUserRes> {
    try {
      if (createUserInput.email) {
        const current_user = await this.userRepository.findOne({
          email: createUserInput.email,
        });
        if (current_user) {
          this.logger.error(
            `This mail address ${createUserInput.email} is already existed!`,
          );
          return {
            user: null,
            message: `EMAIL_ALREADY_EXISTED`,
            status: 400,
          };
        }
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

      return {
        user: newUser,
        status: 201,
        message: 'USER_CREATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        user: null,
      };
    }
  }

  async updateUser(
    updateUserInput: Partial<UpdateUserInput>,
  ): Promise<GetUserRes> {
    try {
      const { id, photo, ...rest } = updateUserInput;
      // Check if user exists first
      const existingUser = await this.userRepository.findOne({ _id: id });
      if (!existingUser) {
        this.logger.error(`User with ID ${id} not found`);
        return {
          user: null,
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }
      // Check if email is already in use by another user
      if (updateUserInput.email) {
        const userWithUsedEmail = await this.userRepository.findOne({
          email: updateUserInput.email,
          _id: { $ne: id },
        });
        if (userWithUsedEmail) {
          this.logger.error(
            `This mail address ${updateUserInput.email} is already in use`,
          );
          return {
            user: null,
            message: `EMAIL_ALREADY_IN_USE`,
            status: 400,
          };
        }
      }
      // Handle photo upload if provided
      if (photo) {
        const imagePath = await handleFileUpload(photo, 'patients');
        rest['photo'] = imagePath;
      }
      // Update the user
      const updatedUser = await this.userRepository.findOneAndUpdate(
        { _id: id },
        {
          ...rest,
        },
      );

      return {
        user: updatedUser,
        status: 200,
        message: 'USER_UPDATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        user: null,
      };
    }
  }

  async getUsersWithPagination(
    getUserInput: GetUsersInput,
  ): Promise<GetUsersPaginator> {
    try {
      const { fullname, role, isDeleted, limit = 10, skip = 0 } = getUserInput;
      const query: any = { isDeleted: false };
      if (isDeleted) {
        query.isDeleted = isDeleted;
      }
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
        select: 'fullname email role photo is_completed',
      });
    } catch (error) {
      this.logger.error('Error getting users:', error);
      return {
        data: [],
        paginatorInfo: {
          count: 0,
          currentPage: 1,
          perPage: getUserInput.limit || 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
        },
      };
    }
  }

  async getUserById(id: string): Promise<GetUserRes> {
    try {
      const user = await this.userRepository.findOneWithPopulate({ _id: id }, [
        'office',
      ]);
      if (!user) {
        return {
          user: null,
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }
      return {
        user,
        status: 200,
        message: 'USER_FOUND',
      };
    } catch (error) {
      this.logger.error('Error getting user by id:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        user: null,
      };
    }
  }

  async affectDoctorAdminToOffice(
    affectUserToOfficeInput: AffectUserToOfficeInput,
  ): Promise<GetUserRes> {
    try {
      const { userId: id, officeId } = affectUserToOfficeInput;

      const foundUser = await this.userRepository.findOne({ _id: id });

      if (!foundUser) {
        return {
          user: null,
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }

      if (foundUser.role !== ERole.ADMIN_DOCTOR) {
        return {
          user: null,
          message: 'USER_IS_NOT_ADMIN_DOCTOR',
          status: 400,
        };
      }

      const foundOffice = await this.officeRepository.findOne({
        _id: officeId,
      });

      if (!foundOffice) {
        return {
          user: null,
          message: 'OFFICE_NOT_FOUND',
          status: 404,
        };
      }

      const updatedUser = await this.userRepository.findOneAndUpdate(
        { _id: id },
        { office: new Types.ObjectId(officeId) },
      );

      return {
        user: updatedUser,
        status: 200,
        message: 'USER_AFFECTED_TO_OFFICE_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error getting user by office affection:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        user: null,
      };
    }
  }

  async removeDoctorAdminFromOffice(userId: string): Promise<GetUserRes> {
    try {
      const foundUser = await this.userRepository.findOne({ _id: userId });

      if (!foundUser) {
        return {
          user: null,
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }

      if (foundUser.role !== ERole.ADMIN_DOCTOR) {
        return {
          user: null,
          message: 'USER_IS_NOT_ADMIN_DOCTOR',
          status: 400,
        };
      }

      const updatedUser = await this.userRepository.findOneAndUpdate(
        { _id: userId },
        { $unset: { office: 1 } },
      );

      return {
        user: updatedUser,
        status: 200,
        message: 'USER_REMOVED_FROM_OFFICE_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error getting user by office removal:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        user: null,
      };
    }
  }
}
