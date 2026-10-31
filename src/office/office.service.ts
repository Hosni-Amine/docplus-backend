import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  deleteUploadedFile,
  ECareRecipientLabel,
  EContractStatus,
  EOfficePlan,
  EOfficeStatus,
  ERole,
  EUserStatus,
} from '../common';
import { IBaseRes } from '../common/responses.dto';
import { OfficeRepository } from './office.repository';
import { OfficeContractRepository } from './office-contract.repository';
import { CreateOfficeInput } from './dto/create-office.input';
import { UpdateOfficeInput } from './dto/update-office.input';
import { CreateContractInput } from './dto/create-contract.input';
import { UpdateContractInput } from './dto/update-contract.input';
import { Office } from './entities/office.entity';
import { Contract } from './entities/contract.entity';

export type OfficeUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: ERole;
  officeStaffRole?: string | null;
  specialty?: string[];
  isOwner?: boolean;
  status?: EUserStatus;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
};

type Actor = {
  id?: string;
  role?: ERole;
  isOwner?: boolean;
  officeId?: { toString(): string } | string;
};

export type ContractDisplayStatus =
  | 'upcoming'
  | 'current'
  | 'expired'
  | 'cancelled';

export type ContractView = Contract & { displayStatus: ContractDisplayStatus };

export interface GetOfficeRes extends IBaseRes {
  office:
    | (Office & {
        officeAdmins?: OfficeUser[];
        currentContract?: ContractView | null;
        contracts?: ContractView[];
      })
    | null;
}

export interface GetOfficesRes extends IBaseRes {
  offices: (Office & { officeAdmins?: OfficeUser[] })[];
}

export interface GetContractsRes extends IBaseRes {
  contracts: ContractView[];
}

export interface GetContractRes extends IBaseRes {
  contract: ContractView | null;
}

@Injectable()
export class OfficeService {
  private readonly logger = new Logger(OfficeService.name);

  constructor(
    private readonly officeRepository: OfficeRepository,
    private readonly contractRepository: OfficeContractRepository,
  ) {}

  /**
   * Create an office. Only the platform admin calls this.
   */
  async createOffice(input: CreateOfficeInput): Promise<GetOfficeRes> {
    try {
      const office = await this.officeRepository.create({
        ...input,
        status: EOfficeStatus.ACTIVE,
        careRecipientLabel:
          input.careRecipientLabel ?? ECareRecipientLabel.PATIENT,
      });
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
      const offices = await this.officeRepository.findAllWithUsers();
      return { status: 200, message: 'OFFICES_FOUND_SUCCESSFULLY', offices };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', offices: [] };
    }
  }

  /**
   * Return one office when the actor is allowed to see it,
   * including the current contract and full contract history.
   */
  async getOfficeById(id: string, actor: Actor): Promise<GetOfficeRes> {
    try {
      if (!this.canAccessOffice(actor, id)) {
        return { status: 403, message: 'FORBIDDEN', office: null };
      }
      const office = await this.officeRepository.findOneWithUsers(id);
      if (!office) {
        return { status: 404, message: 'OFFICE_NOT_FOUND', office: null };
      }
      const rawContracts = await this.contractRepository.findByOffice(id);
      const contracts = rawContracts.map((contract) =>
        this.toContractView(contract),
      );
      const currentContract =
        contracts.find((contract) => contract.displayStatus === 'current') ??
        contracts.find((contract) => contract.displayStatus === 'upcoming') ??
        contracts[0] ??
        null;

      return {
        status: 200,
        message: 'OFFICE_FOUND_SUCCESSFULLY',
        office: { ...office, currentContract, contracts },
      };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', office: null };
    }
  }

  /**
   * Update an office. The platform admin can update any office.
   * Only the office owner can update their own office.
   */
  async updateOffice(
    input: UpdateOfficeInput,
    actor: Actor,
  ): Promise<GetOfficeRes> {
    try {
      if (!this.canManageOffice(actor, input.id)) {
        return { status: 403, message: 'FORBIDDEN', office: null };
      }
      const existing = await this.officeRepository.findOne({ _id: input.id });
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

  /**
   * Mark an office deleted. The record stays, and the route is already limited to the platform admin.
   */
  async deleteOffice(id: string): Promise<IBaseRes> {
    try {
      const existing = await this.officeRepository.findOne({ _id: id });
      if (!existing) {
        return { status: 404, message: 'OFFICE_NOT_FOUND' };
      }

      await this.officeRepository.findOneAndUpdate(
        { _id: id },
        { status: EOfficeStatus.DELETED },
      );
      return { status: 200, message: 'OFFICE_DELETED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  async getContracts(officeId: string): Promise<GetContractsRes> {
    try {
      const office = await this.officeRepository.findOne({ _id: officeId });
      if (!office) {
        return { status: 404, message: 'OFFICE_NOT_FOUND', contracts: [] };
      }
      const contracts = await this.contractRepository.findByOffice(officeId);
      return {
        status: 200,
        message: 'CONTRACTS_FOUND_SUCCESSFULLY',
        contracts: contracts.map((contract) => this.toContractView(contract)),
      };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', contracts: [] };
    }
  }

  async createContract(
    officeId: string,
    input: CreateContractInput,
  ): Promise<GetContractRes> {
    try {
      const office = await this.officeRepository.findOne({ _id: officeId });
      if (!office) {
        return { status: 404, message: 'OFFICE_NOT_FOUND', contract: null };
      }

      const startDate = this.toDate(input.startDate);
      const endDate = this.toDate(input.endDate);
      if (!startDate || !endDate || startDate > endDate) {
        return {
          status: 400,
          message: 'INVALID_CONTRACT_DATES',
          contract: null,
        };
      }

      const overlapping = await this.hasOverlap(officeId, startDate, endDate);
      if (overlapping) {
        return {
          status: 400,
          message: 'CONTRACT_PERIOD_OVERLAPS',
          contract: null,
        };
      }

      const plan = input.plan ?? EOfficePlan.BASIC;
      const contract = await this.contractRepository.create({
        officeId: new Types.ObjectId(officeId),
        startDate,
        endDate,
        status: EContractStatus.ACTIVE,
        plan,
        notes: input.notes,
        documents: input.documents ?? [],
      });

      return {
        status: 201,
        message: 'CONTRACT_CREATED_SUCCESSFULLY',
        contract: this.toContractView(contract),
      };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', contract: null };
    }
  }

  async updateContract(
    contractId: string,
    input: UpdateContractInput,
  ): Promise<GetContractRes> {
    try {
      const existing = await this.contractRepository.findOne({
        _id: contractId,
      });
      if (!existing) {
        return { status: 404, message: 'CONTRACT_NOT_FOUND', contract: null };
      }

      const startDate = input.startDate
        ? this.toDate(input.startDate)
        : existing.startDate;
      const endDate = input.endDate
        ? this.toDate(input.endDate)
        : existing.endDate;
      if (!startDate || !endDate || startDate > endDate) {
        return {
          status: 400,
          message: 'INVALID_CONTRACT_DATES',
          contract: null,
        };
      }

      const nextStatus = input.status ?? existing.status;
      if (nextStatus === EContractStatus.ACTIVE) {
        const overlapping = await this.hasOverlap(
          existing.officeId.toString(),
          startDate,
          endDate,
          contractId,
        );
        if (overlapping) {
          return {
            status: 400,
            message: 'CONTRACT_PERIOD_OVERLAPS',
            contract: null,
          };
        }
      }

      if (input.documents !== undefined) {
        const removed = (existing.documents ?? []).filter(
          (doc) => !input.documents!.includes(doc),
        );
        if (removed.length) {
          await deleteUploadedFile(removed);
        }
      }

      const contract = await this.contractRepository.findOneAndUpdate(
        { _id: contractId },
        {
          startDate,
          endDate,
          ...(input.plan !== undefined && { plan: input.plan }),
          ...(input.documents !== undefined && { documents: input.documents }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.status && { status: input.status }),
        },
      );

      return {
        status: 200,
        message: 'CONTRACT_UPDATED_SUCCESSFULLY',
        contract: contract ? this.toContractView(contract) : null,
      };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR', contract: null };
    }
  }

  private async findCurrentContract(
    officeId: string,
  ): Promise<ContractView | null> {
    const contracts = await this.contractRepository.findByOffice(officeId);
    if (!contracts.length) {
      return null;
    }
    const views = contracts.map((contract) => this.toContractView(contract));
    return (
      views.find((contract) => contract.displayStatus === 'current') ??
      views.find((contract) => contract.displayStatus === 'upcoming') ??
      views[0]
    );
  }

  private async hasOverlap(
    officeId: string,
    startDate: Date,
    endDate: Date,
    exceptId?: string,
  ): Promise<boolean> {
    const contracts = await this.contractRepository.findByOffice(officeId);
    return contracts.some((contract) => {
      if (exceptId && contract._id.toString() === exceptId) {
        return false;
      }
      if (contract.status === EContractStatus.CANCELLED) {
        return false;
      }
      return contract.startDate <= endDate && startDate <= contract.endDate;
    });
  }

  private toContractView(contract: Contract): ContractView {
    return {
      ...contract,
      displayStatus: this.displayStatus(contract),
    };
  }

  private displayStatus(contract: Contract): ContractDisplayStatus {
    if (contract.status === EContractStatus.CANCELLED) {
      return 'cancelled';
    }
    const today = this.startOfDay(new Date());
    const start = this.startOfDay(contract.startDate);
    const end = this.startOfDay(contract.endDate);
    if (today < start) {
      return 'upcoming';
    }
    if (today > end) {
      return 'expired';
    }
    return 'current';
  }

  private toDate(value: string): Date | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return this.startOfDay(date);
  }

  private startOfDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private canAccessOffice(actor: Actor, officeId: string): boolean {
    if (actor.role === ERole.SUPER_ADMIN) {
      return true;
    }
    return actor.officeId?.toString() === officeId;
  }

  private canManageOffice(actor: Actor, officeId: string): boolean {
    if (actor.role === ERole.SUPER_ADMIN) {
      return true;
    }
    return !!actor.isOwner && actor.officeId?.toString() === officeId;
  }
}
