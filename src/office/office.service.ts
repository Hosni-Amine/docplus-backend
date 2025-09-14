import { Injectable, Logger } from '@nestjs/common';
import { CreateOfficeInput } from './dto/create-office.input';
import { UpdateOfficeInput } from './dto/update.office.input';
import { GetOfficesInput } from './dto/get-offices-input';
import { GetOfficesPaginator } from './dto/get-offices-input';
import { OfficeRepository } from './office.repository';
import { GetOfficeRes } from './office.controller';

@Injectable()
export class OfficeService {
  private readonly logger = new Logger(OfficeService.name);

  constructor(private readonly officeRepository: OfficeRepository) {}

  async createOffice(createOfficeInput: CreateOfficeInput): Promise<GetOfficeRes> {
    try {
      // Check if office with same name and address already exists
      const existingOffice = await this.officeRepository.findOne({
        name: createOfficeInput.name,
        address: createOfficeInput.address,
      });

      if (existingOffice) {
        this.logger.error(
          `Office with name ${createOfficeInput.name} at address ${createOfficeInput.address} already exists!`,
        );
        return {
          office: null,
          message: 'OFFICE_ALREADY_EXISTS',
          status: 400,
        };
      }

      const newOffice = await this.officeRepository.create(createOfficeInput);

      this.logger.log(`Office ${newOffice.name} created successfully`);

      return {
        office: newOffice,
        status: 201,
        message: 'OFFICE_CREATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error creating office:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        office: null,
      };
    }
  }

  async updateOffice(updateOfficeInput: UpdateOfficeInput): Promise<GetOfficeRes> {
    try {
      const { id, ...rest } = updateOfficeInput;

      // Check if office exists first
      const existingOffice = await this.officeRepository.findOne({ _id: id });
      if (!existingOffice) {
        this.logger.error(`Office with ID ${id} not found`);
        return {
          office: null,
          message: 'OFFICE_NOT_FOUND',
          status: 404,
        };
      }

      // Check if name and address combination is already used by another office
      if (updateOfficeInput.name && updateOfficeInput.address) {
        const officeWithSameDetails = await this.officeRepository.findOne({
          name: updateOfficeInput.name,
          address: updateOfficeInput.address,
          _id: { $ne: id },
        });

        if (officeWithSameDetails) {
          this.logger.error(
            `Office with name ${updateOfficeInput.name} at address ${updateOfficeInput.address} already exists!`,
          );
          return {
            office: null,
            message: 'OFFICE_DETAILS_ALREADY_EXISTS',
            status: 400,
          };
        }
      }

      // Update the office
      const updatedOffice = await this.officeRepository.findOneAndUpdate(
        { _id: id },
        { ...rest },
      );

      this.logger.log(`Office ${updatedOffice.name} updated successfully`);

      return {
        office: updatedOffice,
        status: 200,
        message: 'OFFICE_UPDATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error updating office:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        office: null,
      };
    }
  }

  async deleteOffice(id: string, isDeleted: boolean): Promise<GetOfficeRes> {
    try {
      const deletedOffice = await this.officeRepository.findOneAndUpdate(
        { _id: id },
        { isDeleted: isDeleted },
      );

      if (!deletedOffice) {
        return {
          office: null,
          message: 'OFFICE_NOT_FOUND',
          status: 404,
        };
      }

      return {
        office: deletedOffice,
        status: 200,
        message: 'OFFICE_DELETED_SUCCESSFULLY',
      };

    } catch (error) {
      this.logger.error('Error deleting office:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        office: null,
      };
    }
  }

  async getOfficesWithPagination(getOfficeInput: GetOfficesInput): Promise<GetOfficesPaginator> {
    try {
      const { name, type, limit = 10, skip = 0 } = getOfficeInput;
      const query: any = {};

      if (type) {
        query.type = type;
      }

      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }

      return await this.officeRepository.getWithPagination(query, {
        limit,
        skip,
        sort: { name: 1 },
        select: 'name address type specializations images',
      });

    } catch (error) {
      this.logger.error('Error getting offices:', error);
      return {
        data: [],
        paginatorInfo: {
          count: 0,
          currentPage: 1,
          perPage: getOfficeInput.limit || 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
        },
      };
    }
  }

  async getOfficeById(id: string): Promise<GetOfficeRes> {
    try {
      const office = await this.officeRepository.findOne({ _id: id });

      if (!office) {
        return {
          office: null,
          message: 'OFFICE_NOT_FOUND',
          status: 404,
        };
      }

      return {
        office,
        status: 200,
        message: 'OFFICE_FOUND',
      };
    } catch (error) {
      this.logger.error('Error getting office by ID:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        office: null,
      };
    }
  }
}
