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
import { CreateFolderInput } from './dto/create-folder.input';
import { FavoriteFolderInput } from './dto/favorite-folder.input';
import { FolderSharedInput } from './dto/folder-shared.input';
import { FolderTagsInput } from './dto/folder-tags.input';
import { UpdateFolderInput } from './dto/update-folder.input';
import { FolderService, GetFolderRes, GetFoldersRes } from './folder.service';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: string;
};

@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Post()
  async createFolder(
    @Body() input: CreateFolderInput,
    @CurrentUser() actor: Actor,
  ): Promise<GetFolderRes> {
    return this.folderService.createFolder(input, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get()
  async getFolders(@CurrentUser() actor: Actor): Promise<GetFoldersRes> {
    return this.folderService.getFolders(actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Get(':id')
  async getFolderById(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<GetFolderRes> {
    return this.folderService.getFolderById(id, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('favorite')
  async favoriteFolder(
    @Body() input: FavoriteFolderInput,
    @CurrentUser() actor: Actor,
  ): Promise<IBaseRes> {
    return this.folderService.favoriteFolder(input, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('tags')
  async updateFolderTags(
    @Body() input: FolderTagsInput,
    @CurrentUser() actor: Actor,
  ): Promise<IBaseRes> {
    return this.folderService.updateFolderTags(input, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('shared')
  async updateFolderShared(
    @Body() input: FolderSharedInput,
    @CurrentUser() actor: Actor,
  ): Promise<IBaseRes> {
    return this.folderService.updateFolderShared(input, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('delete/:id')
  async deleteFolder(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<IBaseRes> {
    return this.folderService.deleteFolder(id, actor);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch()
  async updateFolder(
    @Body() input: UpdateFolderInput,
    @CurrentUser() actor: Actor,
  ): Promise<GetFolderRes> {
    return this.folderService.updateFolder(input, actor);
  }
}
