import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { AuthGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators/roles.decorator';
import { ERole } from '../common';
import { DemoRequestService } from './demo-request.service';
import { RequestDemoOtpInput } from './dto/request-demo-otp.input';
import { CreateDemoRequestInput } from './dto/create-demo-request.input';
import { UpdateDemoRequestStatusInput } from './dto/update-demo-request-status.input';
import { GetDemoRequestsInput } from './dto/get-demo-requests.input';

@Controller('demo-request')
export class DemoRequestController {
  constructor(private readonly demoRequestService: DemoRequestService) {}

  /**
   * Public / Open API: Request an OTP to verify email for demo request.
   */
  @Post('request-otp')
  async requestOtp(@Body() input: RequestDemoOtpInput, @Ip() ip: string) {
    return this.demoRequestService.requestOtp(input, ip);
  }

  /**
   * Public / Open API: Submit Demo Request after OTP code verification.
   */
  @Post()
  async create(@Body() input: CreateDemoRequestInput, @Ip() ip: string) {
    return this.demoRequestService.create(input, ip);
  }

  /**
   * Protected Admin API: List demo requests with optional filtering.
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Get()
  async findAll(@Query() query: GetDemoRequestsInput) {
    return this.demoRequestService.findAll(query);
  }

  /**
   * Protected Admin API: Get single demo request by ID.
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.demoRequestService.findOne(id);
  }

  /**
   * Protected Admin API: Update status ONLY.
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() input: UpdateDemoRequestStatusInput,
  ) {
    return this.demoRequestService.updateStatus(id, input);
  }

  /**
   * Protected Admin API: Soft delete demo request.
   */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.demoRequestService.remove(id);
  }
}
