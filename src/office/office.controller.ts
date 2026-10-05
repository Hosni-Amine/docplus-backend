import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { AuthGuard, RolesGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { Roles } from '../decorators/roles.decorator';
import { ERole } from '../common';
import { GetOfficeRes, GetOfficesRes, OfficeService } from './office.service';
import { CreateOfficeInput } from './dto/create-office.input';
import { UpdateOfficeInput } from './dto/update-office.input';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: string;
};

@Controller('office')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Post()
  async createOffice(@Body() input: CreateOfficeInput): Promise<GetOfficeRes> {
    return this.officeService.createOffice(input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Get()
  async getOffices(): Promise<GetOfficesRes> {
    return this.officeService.getOffices();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getOfficeById(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
  ): Promise<GetOfficeRes> {
    return this.officeService.getOfficeById(id, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN, ERole.ADMIN)
  @Patch()
  async updateOffice(
    @Body() input: UpdateOfficeInput,
    @CurrentUser() user: Actor,
  ): Promise<GetOfficeRes> {
    return this.officeService.updateOffice(input, user);
  }
}
