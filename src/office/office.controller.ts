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
import { IBaseRes } from '../common/responses.dto';
import {
  GetContractRes,
  GetContractsRes,
  GetOfficeRes,
  GetOfficesRes,
  OfficeService,
} from './office.service';
import { CreateOfficeInput } from './dto/create-office.input';
import { UpdateOfficeInput } from './dto/update-office.input';
import { CreateContractInput } from './dto/create-contract.input';
import { UpdateContractInput } from './dto/update-contract.input';

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

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get('me')
  async getMyOffice(@CurrentUser() user: Actor): Promise<GetOfficeRes> {
    if (!user.officeId) {
      return { status: 404, message: 'OFFICE_NOT_FOUND', office: null };
    }
    return this.officeService.getOfficeById(user.officeId.toString(), user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Get(':id/contracts')
  async getContracts(@Param('id') id: string): Promise<GetContractsRes> {
    return this.officeService.getContracts(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Post(':id/contracts')
  async createContract(
    @Param('id') id: string,
    @Body() input: CreateContractInput,
  ): Promise<GetContractRes> {
    return this.officeService.createContract(id, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Patch('contracts/:contractId')
  async updateContract(
    @Param('contractId') contractId: string,
    @Body() input: UpdateContractInput,
  ): Promise<GetContractRes> {
    return this.officeService.updateContract(contractId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Get(':id')
  async getOfficeById(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
  ): Promise<GetOfficeRes> {
    return this.officeService.getOfficeById(id, user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Patch('delete/:id')
  async deleteOffice(@Param('id') id: string): Promise<IBaseRes> {
    return this.officeService.deleteOffice(id);
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
