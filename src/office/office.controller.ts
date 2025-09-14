import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OfficeService } from './office.service';
import { CreateOfficeInput } from './dto/create-office.input';
import { UpdateOfficeInput } from './dto/update.office.input';
import { IBaseRes } from '@common/responses.dto';
import { Office } from './entities/office.entity';
import { GetOfficesInput } from './dto/get-offices-input';
import { GetOfficesPaginator } from './dto/get-offices-input';

export interface GetOfficeRes extends IBaseRes {
  office?: Office;
}

@Controller('office')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}

  @Post()
  async createOffice(
    @Body() createOfficeInput: CreateOfficeInput,
  ): Promise<GetOfficeRes> {
    return await this.officeService.createOffice(createOfficeInput);
  }

  @Get('with-pagination')
  async getOfficesWithPagination(
    @Body() getOfficeInput: GetOfficesInput,
  ): Promise<GetOfficesPaginator> {
    return await this.officeService.getOfficesWithPagination(getOfficeInput);
  }

  @Get(':id')
  async getOfficeById(@Param('id') id: string): Promise<GetOfficeRes> {
    return await this.officeService.getOfficeById(id);
  }

  @Patch()
  async updateOffice(
    @Body() updateOfficeInput: UpdateOfficeInput,
  ): Promise<GetOfficeRes> {
    return await this.officeService.updateOffice(updateOfficeInput);
  }

  @Delete()
  async deleteOffice(
    @Body() deleteOfficeInput: { officeId: string; isDeleted: boolean },
  ): Promise<GetOfficeRes> {
    return await this.officeService.deleteOffice(deleteOfficeInput);
  }
}
