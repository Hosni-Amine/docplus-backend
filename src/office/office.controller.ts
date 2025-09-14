import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
    @Res() response: Response,
  ) {
    const res: GetOfficeRes = await this.officeService.createOffice(createOfficeInput);
    return response.status(res.status).send({
      ...res,
    });
  }

  @Get('with-pagination')
  async getOfficesWithPagination(
    @Body() getOfficeInput: GetOfficesInput,
  ): Promise<GetOfficesPaginator> {
    return await this.officeService.getOfficesWithPagination(
      getOfficeInput,
    );
  }

  @Get(':id')
  async getOfficeById(@Param('id') id: string, @Res() response: Response) {
    const res: GetOfficeRes = await this.officeService.getOfficeById(id);
    return response.status(res.status).send({
      ...res,
    });
  }

  @Patch()
  async updateOffice(
    @Body() updateOfficeInput: UpdateOfficeInput,
    @Res() response: Response,
  ) {
    const res: GetOfficeRes = await this.officeService.updateOffice(updateOfficeInput);
    return response.status(res.status).send({
      ...res,
    });
  }

  @Delete()
  async deleteOffice(
    @Body() body: { id: string; isDeleted: boolean },
    @Res() response: Response,
  ) {
    const res: GetOfficeRes = await this.officeService.deleteOffice(
      body.id,
      body.isDeleted,
    );
    return response.status(res.status).send({
      ...res,
    });
  }
}
