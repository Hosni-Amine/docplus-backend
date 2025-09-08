import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { GetUserRes } from '@app/common/responses.dto';
import { v4 as uuidv4 } from 'uuid';
import { handleFileUpload } from '@app/common';
import { GetUsersPaginator } from './dto/get-users-input';
import { GetUsersInput } from './dto/get-users-input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update.user.input';
import { MailingService } from '@src/mailing/mailing.service';

@Injectable()
export class UserService {
  constructor(
    private readonly mailingService: MailingService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  private readonly logger = new Logger(UserService.name);

  async createUser(createUserInput: CreateUserInput): Promise<GetUserRes> {
    try {
      if (createUserInput.email) {
        const current_user = await this.userModel.findOne({
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
      const confirmationToken = uuidv4();
      const newUser = await this.userModel.create({
        ...createUserInput,
        is_verified: false,
        is_completed: false,
        confirmation_token: confirmationToken,
      });

      if (newUser.email) {
        await this.mailingService.sendUserConfirmation(
          newUser.email,
          newUser.fullname,
          newUser.confirmation_token,
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
        message: error.message,
        status: 500,
        user: null,
      };
    }
  }

  async unverifyUser(id: string): Promise<GetUserRes> {
    await this.userModel.findByIdAndUpdate(
      id,
      { is_verified: false },
      { new: true },
    );
    return {
      user: null,
      status: 200,
      message: 'USER_UNVERIFIED_SUCCESSFULLY',
    };
  }

  async updateUser(
    updateUserInput: Partial<UpdateUserInput>,
  ): Promise<GetUserRes> {
    try {
      const { id, photo, ...rest } = updateUserInput;
      if (updateUserInput.email) {
        const existingUser = await this.userModel.findOne({
          email: updateUserInput.email,
          _id: { $ne: id },
        });
        if (existingUser) {
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

      if (photo) {
        const imagePath = await handleFileUpload(photo, 'patients');
        rest['photo'] = imagePath;
      }
      const updatedUser = await this.userModel.findByIdAndUpdate(
        { _id: id },
        {
          ...rest,
        },
        { new: true },
      );

      if (!updatedUser) {
        return {
          user: null,
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }
      return {
        user: updatedUser,
        status: 200,
        message: 'USER_UPDATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        message: error.message,
        status: 500,
        user: null,
      };
    }
  }

  async deleteUser(id: string): Promise<GetUserRes> {
    try {
      const deletedUser = await this.userModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true },
      );

      if (!deletedUser) {
        return {
          user: null,
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }

      return {
        user: deletedUser,
        status: 200,
        message: 'USER_DELETED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        message: error.message,
        status: 500,
        user: null,
      };
    }
  }

  async getUsers(getUserInput: GetUsersInput): Promise<GetUsersPaginator> {
    try {
      const { fullname, limit = 10, skip = 0 } = getUserInput;
      const currentPage = Math.floor(skip / limit) + 1;

      // Build query
      const query: any = { isDeleted: false };
      if (fullname) {
        query.fullname = { $regex: fullname, $options: 'i' };
      }
      // Execute query with pagination and field selection
      const [data, totalCount] = await Promise.all([
        this.userModel
          .find(query)
          .select('fullname email role photo is_completed')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.userModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data,
        paginatorInfo: {
          count: totalCount,
          currentPage,
          perPage: limit,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
          nextPage: currentPage < totalPages ? currentPage + 1 : null,
          prevPage: currentPage > 1 ? currentPage - 1 : null,
        },
      };
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
}
