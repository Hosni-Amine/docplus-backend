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
import { CreateDocumentInput } from './dto/create-document.input';
import { UpdateDocumentInput } from './dto/update-document.input';
import {
  DocumentService,
  GetDocumentRes,
  GetDocumentsRes,
} from './document.service';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: string;
};

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Post()
  async createDocument(
    @Body() input: CreateDocumentInput,
    @CurrentUser() actor: Actor,
  ): Promise<GetDocumentRes> {
    return this.documentService.createDocument(input, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get('folder/:folderId')
  async getDocuments(
    @Param('folderId') folderId: string,
    @CurrentUser() actor: Actor,
  ): Promise<GetDocumentsRes> {
    return this.documentService.getDocuments(folderId, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('delete/:id')
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<IBaseRes> {
    return this.documentService.deleteDocument(id, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch()
  async updateDocument(
    @Body() input: UpdateDocumentInput,
    @CurrentUser() actor: Actor,
  ): Promise<GetDocumentRes> {
    return this.documentService.updateDocument(input, actor);
  }
}
