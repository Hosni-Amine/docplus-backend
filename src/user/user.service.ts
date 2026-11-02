import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  EOfficeStaffRole,
  EOfficeStatus,
  ERole,
  EUserStatus,
  EMedicalSpecialty,
  deleteUploadedFile,
} from '../common';
import { OfficeRepository } from '../office/office.repository';
import { GetUsersInput, GetUsersPaginator } from './dto/get-users-input';
import { PublicDoctorFilterInput } from './dto/public-doctor-filter.input';
import { CreateUserInput } from './dto/create-user.input';
import { ChangeOwnershipInput } from './dto/change-ownership.input';
import { UpdateUserInput } from './dto/update.user.input';
import { MailingService } from '../mailing/mailing.service';
import { UserRepository } from './user.repository';
import { IBaseRes } from '../common/responses.dto';
import { GetAllUsersRes, GetUserRes } from './user.controller';
import { User } from './entities/user.entity';
import {
  listUserFields,
  privateUserFields,
  publicDoctorFields,
  publicOfficeFields,
} from './user.fields';

type Actor = {
  id?: string;
  role?: ERole;
  isOwner?: boolean;
  officeId?: { toString(): string } | string;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly mailingService: MailingService,
    private readonly userRepository: UserRepository,
    private readonly officeRepository: OfficeRepository,
  ) {}

  /**
   * Create a admin or super admin and send a welcome email when an address is present.
   */
  async createAdminSuperAdmin(
    createUserInput: CreateUserInput,
  ): Promise<IBaseRes> {
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

      const { officeId, role, ...rest } = createUserInput;
      if (role !== ERole.ADMIN && role !== ERole.SUPER_ADMIN) {
        return this.result(403, 'FORBIDDEN');
      }
      if (!createUserInput.email) {
        return this.result(400, 'EMAIL_REQUIRED');
      }
      if (role === ERole.ADMIN) {
        if (!officeId) {
          return this.result(400, 'OFFICE_REQUIRED');
        }
        const office = await this.officeRepository.findOne({ _id: officeId });
        if (!office || office.status !== EOfficeStatus.ACTIVE) {
          return this.result(404, 'OFFICE_NOT_FOUND');
        }
      }

      const newUser = await this.userRepository.create({
        ...rest,
        isPublic: false,
        verified: false,
        emailAppointmentReminders: true,
        emailAppointmentConfirmations: true,
        status: EUserStatus.ACTIVE,
        role,
        officeId:
          role === ERole.SUPER_ADMIN ? undefined : new Types.ObjectId(officeId),
      });

      if (newUser.email) {
        await this.mailingService.sendWelcomeEmail(
          newUser.email,
          newUser.firstName || newUser.email,
        );
      }

      return { status: 201, message: 'USER_CREATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return this.result(500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Create a USER or ADMIN in the actor's office.
   */
  async createUser(
    createUserInput: CreateUserInput,
    actor: Actor,
  ): Promise<IBaseRes> {
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
      if (role !== ERole.USER && role !== ERole.ADMIN) {
        return this.result(403, 'FORBIDDEN');
      }
      if (role === ERole.ADMIN && !actor.isOwner) {
        return this.result(403, 'FORBIDDEN');
      }
      if (role === ERole.ADMIN && !createUserInput.email) {
        return this.result(400, 'EMAIL_REQUIRED');
      }
      const officeId = actor.officeId?.toString();

      if (!officeId) {
        return this.result(400, 'OFFICE_REQUIRED');
      }

      const office = await this.officeRepository.findOne({ _id: officeId });
      if (!office || office.status !== EOfficeStatus.ACTIVE) {
        return this.result(404, 'OFFICE_NOT_FOUND');
      }

      const newUser = await this.userRepository.create({
        ...rest,
        isPublic: false,
        verified: false,
        emailAppointmentReminders: true,
        emailAppointmentConfirmations: true,
        status: EUserStatus.ACTIVE,
        role,
        officeId: new Types.ObjectId(officeId),
      });

      if (newUser.email) {
        await this.mailingService.sendWelcomeEmail(
          newUser.email,
          newUser.firstName || newUser.email,
        );
      }

      return { status: 201, message: 'USER_CREATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return this.result(500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Super admin only: set or clear office ownership on an ADMIN user.
   */
  async changeOwnership(input: ChangeOwnershipInput): Promise<IBaseRes> {
    try {
      const existingUser = await this.userRepository.findOne({ _id: input.id });
      if (!existingUser) {
        this.logger.error(`User with ID ${input.id} not found`);
        return this.result(404, 'USER_NOT_FOUND');
      }

      if (existingUser.role !== ERole.ADMIN) {
        return this.result(400, 'INVALID_OWNERSHIP_TARGET');
      }

      await this.userRepository.findOneAndUpdate(
        { _id: input.id },
        { isOwner: !!input.isOwner },
      );

      return { status: 200, message: 'OWNERSHIP_UPDATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return this.result(500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Update a profile. The route already allows only admins and super admins.
   * Role and status can be changed only by a super admin.
   */
  async updateUser(
    updateUserInput: Partial<UpdateUserInput>,
    actor: Actor,
  ): Promise<IBaseRes> {
    try {
      const { id, role, status, ...rest } = updateUserInput;
      const isSuperAdmin = actor?.role === ERole.SUPER_ADMIN;

      // Role and status are reserved for a super admin.
      if ((role || status) && !isSuperAdmin) {
        return this.result(403, 'FORBIDDEN');
      }

      const existingUser = await this.userRepository.findOne({ _id: id });
      if (!existingUser) {
        this.logger.error(`User with ID ${id} not found`);
        return this.result(404, 'USER_NOT_FOUND');
      }

      const isSelf = actor?.id === id;
      if (
        !isSuperAdmin &&
        existingUser.role === ERole.ADMIN &&
        !isSelf &&
        !actor.isOwner
      ) {
        return this.result(403, 'FORBIDDEN');
      }

      // officeStaffRole + specialty: owner, super admin, or the user themselves only.
      const canEditStaffProfile = isSuperAdmin || isSelf || !!actor.isOwner;
      if (
        !canEditStaffProfile &&
        (rest.officeStaffRole !== undefined || rest.specialty !== undefined)
      ) {
        return this.result(403, 'FORBIDDEN');
      }

      if (rest.email && (await this.emailTaken(rest.email, id))) {
        this.logger.error(`This mail address ${rest.email} is already in use`);
        return this.result(400, 'EMAIL_ALREADY_IN_USE');
      }

      const updates: Partial<User> = { ...rest };

      // Public profile: the user themself, a platform admin, or an office owner can change it.
      const canSetPublic = isSelf || isSuperAdmin || !!actor?.isOwner;
      if ('isPublic' in updates && !canSetPublic) {
        delete updates.isPublic;
      }

      // Verified badge: super admin only.
      const canSetVerified = isSuperAdmin || !!actor?.isOwner;
      if ('verified' in updates && !canSetVerified) {
        delete updates.verified;
      }

      // Role and status stay out of the profile payload. Only a super admin can set them.
      if (isSuperAdmin) {
        if (role) updates.role = role as ERole;
        if (status) updates.status = status;
      }

      // A changed email, role, or a disabled/deleted status invalidates the current token.
      const accessChanged =
        (updates.email !== undefined && updates.email !== existingUser.email) ||
        (updates.role !== undefined && updates.role !== existingUser.role) ||
        updates.status === EUserStatus.DISABLED ||
        updates.status === EUserStatus.DELETED;

      if (accessChanged) {
        updates.tokenVersion = (existingUser.tokenVersion ?? 0) + 1;
      }

      if (
        updates.avatarUrl &&
        existingUser.avatarUrl &&
        updates.avatarUrl !== existingUser.avatarUrl
      ) {
        await deleteUploadedFile([existingUser.avatarUrl]);
      }

      await this.userRepository.findOneAndUpdate({ _id: id }, updates);

      return { status: 200, message: 'USER_UPDATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return this.result(500, 'INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Soft-delete a user. The route is already limited to admins.
   */
  async deleteUser(id: string, actor: Actor): Promise<IBaseRes> {
    try {
      const existingUser = await this.userRepository.findOne({ _id: id });
      if (!existingUser) {
        this.logger.error(`User with ID ${id} not found`);
        return this.result(404, 'USER_NOT_FOUND');
      }

      if (
        actor.role !== ERole.SUPER_ADMIN &&
        existingUser.role === ERole.ADMIN &&
        !actor.isOwner
      ) {
        return this.result(403, 'FORBIDDEN');
      }

      await this.userRepository.findOneAndUpdate(
        { _id: id },
        {
          status: EUserStatus.DELETED,
          tokenVersion: (existingUser.tokenVersion ?? 0) + 1,
        },
      );

      return { status: 200, message: 'USER_DELETED_SUCCESSFULLY' };
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
    actor?: User,
  ): Promise<GetUsersPaginator> {
    try {
      const { name, role, status, limit = 10, skip = 0 } = getUserInput;
      const query: Record<string, unknown> = {};

      if (actor && actor.role === ERole.ADMIN) {
        if (!actor.officeId) {
          return emptyUsersPage(limit);
        }
        query.officeId = actor.officeId;
      }

      if (status) {
        query.status = status;
      }

      if (role) {
        query.role = role;
      }
      if (name) {
        const nameRegex = { $regex: name, $options: 'i' };
        query.$or = [
          { firstName: nameRegex },
          { lastName: nameRegex },
          { midNames: nameRegex },
        ];
      }

      return await this.userRepository.getWithPagination(query, {
        limit,
        skip,
        sort: { lastName: -1, firstName: -1 },
        select: listUserFields,
      });
    } catch (error) {
      this.logger.error('Error getting users:', error);
      return emptyUsersPage(getUserInput.limit || 10);
    }
  }

  /**
   * Return office users, optionally filtered by role (e.g. USER, ADMIN).
   * If role is omitted, returns all non-deleted users for the office.
   */
  async getOfficeUsers(
    officeId: string,
    role?: ERole,
  ): Promise<GetAllUsersRes> {
    try {
      const query: Record<string, any> = {
        officeId,
        status: { $ne: EUserStatus.DELETED },
      };
      if (role) {
        query.role = role;
      }
      const users = await this.userRepository.find(query, listUserFields);
      return {
        users,
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
   * Return super admin users.
   */
  async getAllSuperAdmins(): Promise<GetAllUsersRes> {
    try {
      const query = { role: ERole.SUPER_ADMIN };

      const users = await this.userRepository.find(query, listUserFields);
      return {
        users,
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
  async getUserById(id: string, actor?: User): Promise<GetUserRes> {
    try {
      const user = await this.userRepository.findOne(
        { _id: id },
        { select: privateUserFields },
      );
      if (!user) {
        return this.result(404, 'USER_NOT_FOUND');
      }

      if (actor && actor.role !== ERole.SUPER_ADMIN) {
        const isSelf = actor._id?.toString() === user._id?.toString();
        const sameOffice =
          actor.officeId &&
          user.officeId &&
          actor.officeId.toString() === user.officeId.toString();

        if (!isSelf && !sameOffice) {
          return this.result(403, 'FORBIDDEN');
        }
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
   * Search public active doctors for landing page with filtering.
   * Office address and location are checked from office, not user.
   * Returns clean list of doctors without pagination, strictly excluding doctor home address.
   */
  async findPublicDoctors(
    filter: PublicDoctorFilterInput,
  ): Promise<{ status: number; message: string; doctors: any[] }> {
    try {
      const { name, specialty, address } = filter;
      const query: Record<string, unknown> = {
        role: ERole.ADMIN,
        officeStaffRole: EOfficeStaffRole.DOCTOR,
        status: EUserStatus.ACTIVE,
        isPublic: true,
      };

      if (specialty) {
        query.specialty = specialty;
      }

      if (name && name.trim()) {
        const trimmedName = name.trim();
        const tokens = trimmedName.split(/\s+/).filter(Boolean);
        const nameRegex = { $regex: trimmedName, $options: 'i' };

        if (tokens.length > 1) {
          query.$or = [
            { firstName: nameRegex },
            { lastName: nameRegex },
            {
              $and: [
                { firstName: { $regex: tokens[0], $options: 'i' } },
                {
                  lastName: {
                    $regex: tokens.slice(1).join(' '),
                    $options: 'i',
                  },
                },
              ],
            },
            {
              $and: [
                { lastName: { $regex: tokens[0], $options: 'i' } },
                {
                  firstName: {
                    $regex: tokens.slice(1).join(' '),
                    $options: 'i',
                  },
                },
              ],
            },
          ];
        } else {
          query.$or = [{ firstName: nameRegex }, { lastName: nameRegex }];
        }
      }

      // Check address ONLY from active office
      if (address && address.trim()) {
        const addrRegex = { $regex: address.trim(), $options: 'i' };
        const matchingOffices = await this.officeRepository.find({
          status: EOfficeStatus.ACTIVE,
          $or: [
            { address: addrRegex },
            { city: addrRegex },
            { state: addrRegex },
            { country: addrRegex },
            { zipCode: addrRegex },
            { legalName: addrRegex },
          ],
        });

        const matchingOfficeIds = matchingOffices.map((off) => off._id);

        if (matchingOfficeIds.length === 0) {
          return { status: 200, message: 'SUCCESS', doctors: [] };
        }

        query.officeId = { $in: matchingOfficeIds };
      }

      const doctors = await this.userRepository.findWithOfficePopulate(query, {
        sort: { lastName: 1, firstName: 1 },
        userSelect: publicDoctorFields,
        officeSelect: publicOfficeFields,
      });

      return {
        status: 200,
        message: 'SUCCESS',
        doctors,
      };
    } catch (error) {
      this.logger.error('Error finding public doctors:', error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', doctors: [] };
    }
  }

  /**
   * Return available specialties from active public doctors along with all enum values.
   */
  async getPublicDoctorSpecialties(): Promise<{
    status: number;
    message: string;
    availableSpecialties: string[];
    allSpecialties: string[];
  }> {
    try {
      const activeSpecialties =
        await this.userRepository.getDistinctSpecialties({
          role: ERole.ADMIN,
          officeStaffRole: EOfficeStaffRole.DOCTOR,
          status: EUserStatus.ACTIVE,
          isPublic: true,
        });

      return {
        status: 200,
        message: 'SPECIALTIES_FETCHED_SUCCESSFULLY',
        availableSpecialties: activeSpecialties,
        allSpecialties: Object.values(EMedicalSpecialty),
      };
    } catch (error) {
      this.logger.error('Error fetching doctor specialties:', error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        availableSpecialties: [],
        allSpecialties: Object.values(EMedicalSpecialty),
      };
    }
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
      user,
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
