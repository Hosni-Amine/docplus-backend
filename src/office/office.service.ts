import { Injectable, Logger } from '@nestjs/common';
import { ERole } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { OfficeRepository } from './office.repository';
import { CreateOfficeInput } from './dto/create-office.input';
import { UpdateOfficeInput } from './dto/update-office.input';
import { Office } from './entities/office.entity';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: { toString(): string } | string;
};

export interface GetOfficeRes extends IBaseRes {
  office: Office | null;
}

export interface GetOfficesRes extends IBaseRes {
  offices: Office[];
}

@Injectable()
export class OfficeService {
  private readonly logger = new Logger(OfficeService.name);

  constructor(private readonly officeRepository: OfficeRepository) {}

  /**
   * Create an office. Only the platform admin calls this.
   */
  async createOffice(input: CreateOfficeInput): Promise<GetOfficeRes> {
    try {
      const office = await this.officeRepository.create(input);
      return { status: 201, message: 'OFFICE_CREATED_SUCCESSFULLY', office };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', office: null };
    }
  }

  /**
   * Platform admin sees every office. A doctor sees only their own.
   */
  async getOffices(): Promise<GetOfficesRes> {
    try {
      const offices = await this.officeRepository.find({ isDeleted: false });
      return { status: 200, message: 'OFFICES_FOUND_SUCCESSFULLY', offices };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', offices: [] };
    }
  }

  /**
   * Return one office when the actor is allowed to see it.
   */
  async getOfficeById(id: string, actor: Actor): Promise<GetOfficeRes> {
    try {
      if (!this.canAccess(actor, id)) {
        return { status: 403, message: 'FORBIDDEN', office: null };
      }
      const office = await this.officeRepository.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!office) {
        return { status: 404, message: 'OFFICE_NOT_FOUND', office: null };
      }
      return { status: 200, message: 'OFFICE_FOUND_SUCCESSFULLY', office };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', office: null };
    }
  }

  /**
   * Update an office. The platform admin can update any office.
   * An office admin can update only their own.
   */
  async updateOffice(
    input: UpdateOfficeInput,
    actor: Actor,
  ): Promise<GetOfficeRes> {
    try {
      if (!this.canAccess(actor, input.id)) {
        return { status: 403, message: 'FORBIDDEN', office: null };
      }
      const existing = await this.officeRepository.findOne({
        _id: input.id,
        isDeleted: false,
      });
      if (!existing) {
        return { status: 404, message: 'OFFICE_NOT_FOUND', office: null };
      }
      const { id, ...updates } = input;
      const office = await this.officeRepository.findOneAndUpdate(
        { _id: id },
        updates,
      );
      return {
        status: 200,
        message: 'OFFICE_UPDATED_SUCCESSFULLY',
        office: office ?? null,
      };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', office: null };
    }
  }

  private canAccess(actor: Actor, officeId: string): boolean {
    if (actor.role === ERole.SUPER_ADMIN) {
      return true;
    }
    return actor.officeId?.toString() === officeId;
  }
}
