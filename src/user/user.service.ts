import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { GetUserResDTO } from '@app/common/responses.dto';
import { v4 as uuidv4 } from 'uuid';
import { handleFileUpload } from '@app/common';
import { GetUserInput } from './dto/get-users-input';
import { CreateUserDTO, GetUsersResDTO, UpdateUserDTO } from './dto/user.dto';
import { MailingService } from '@src/mailing/mailing.service';

@Injectable()
export class UserService {
  constructor(
    private readonly mailingService: MailingService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }
  private readonly logger = new Logger(UserService.name);

  async createUser(createUserDto: CreateUserDTO): Promise<GetUserResDTO> {
    try{
      if(createUserDto.email){
        const current_user = await this.userModel.findOne({ email: createUserDto.email });
        if (current_user) {
          this.logger.error(`This mail address ${createUserDto.email} is already existed!`);
          return {
            user: null,
            message: `This mail address ${createUserDto.email} is already existed!`,
            status: 400
          }
        }
      }
      const expirationHours = 24;
      /* for test */
      /* const hashPassword = await argon.hash(createUserDto.password) */
      const confirmationToken = uuidv4();
      const newUser = await this.userModel.create({
        ...createUserDto,
        is_verified: false,
        is_completed: false,
        confirmation_token: confirmationToken,
        confirmation_token_validity: new Date(Date.now() + 1000 * 60 * 60 * expirationHours),
        /* password: hashPassword */
      });

      if(newUser.email){
        await this.mailingService.sendUserConfirmation(newUser.email, newUser.fullname, newUser.confirmation_token,expirationHours);
      }
      
      return {
          user: newUser,
          status: 201,
          message: 'User created successfully'
      };
    }
    catch(error){
      this.logger.error(error);
      return{
        message: error.message, 
        status: 500,
        user: null
      }
    }
  }

  async unverifyUser(id: string): Promise<GetUserResDTO> {
    await this.userModel.findByIdAndUpdate(id, { is_verified: false }, { new: true });
    return {
      user: null,
      status: 200,
      message: 'User unverified successfully'
    }
  }

  async updateUser(
    updateUserDto: Partial<UpdateUserDTO>,
  ): Promise<GetUserResDTO> {
    try {
      const {id, photo, ...rest} = updateUserDto;
      if(updateUserDto.email) {
        const existingUser = await this.userModel.findOne({ 
          email: updateUserDto.email,
          _id: { $ne: id }
        });
        if (existingUser) {
          this.logger.error(`This mail address ${updateUserDto.email} is already in use`);
          return {
            user: null,
            message: `This mail address ${updateUserDto.email} is already in use`,
            status: 400
          }
        }
      }

      if (photo) {
        const imagePath = await handleFileUpload(photo, 'patients');
        rest['photo'] = imagePath;
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        rest,
        { new: true }
      );

      if (!updatedUser) {
        return {
          user: null,
          message: 'User not found',
          status: 404
        }
      }
      return {
        user: updatedUser,
        status: 200,
        message: 'User updated successfully'
      };
    } catch(error) {
      this.logger.error(error);
      return {
        message: error.message,
        status: 500,
        user: null
      }
    }
  }

  async deleteUser(id: string): Promise<GetUserResDTO> {
    try {
      const deletedUser = await this.userModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!deletedUser) {
        return {
          user: null,
          message: 'User not found',
          status: 404
        }
      }

      return {
        user: deletedUser,
        status: 200,
        message: 'User deleted successfully'
      };
    } catch(error) {
      this.logger.error(error);
      return {
        message: error.message,
        status: 500,
        user: null
      }
    }
  }

  async getUsers(getUserInput: GetUserInput): Promise<GetUsersResDTO> {
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
        this.userModel.countDocuments(query)
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
          prevPage: currentPage > 1 ? currentPage - 1 : null
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
          prevPage: null
        },
      };
    }
  }
}