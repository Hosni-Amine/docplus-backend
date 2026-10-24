import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ERole } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { CreateFolderInput } from './dto/create-folder.input';
import { FavoriteFolderInput } from './dto/favorite-folder.input';
import { FolderSharedInput } from './dto/folder-shared.input';
import { FolderTagsInput } from './dto/folder-tags.input';
import { UpdateFolderInput } from './dto/update-folder.input';
import { Folder } from './entities/folder.entity';
import { FolderRepository } from './folder.repository';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: { toString(): string } | string;
};

export interface GetFolderRes extends IBaseRes {
  folder: Folder | null;
}

export interface GetFoldersRes extends IBaseRes {
  folders: Folder[];
}

@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);

  constructor(private readonly folderRepository: FolderRepository) {}

  /**
   * Create a medical folder for a patient in the actor's office.
   */
  async createFolder(
    input: CreateFolderInput,
    actor: Actor,
  ): Promise<GetFolderRes> {
    try {
      if (!actor.officeId || !actor.id) {
        return { status: 403, message: 'OFFICE_REQUIRED', folder: null };
      }

      const officeId = actor.officeId.toString();
      const actorId = new Types.ObjectId(actor.id);
      const folder = await this.folderRepository.create({
        title: input.title,
        notes: input.notes,
        userId: new Types.ObjectId(input.userId),
        officeId: new Types.ObjectId(officeId),
        createdBy: actorId,
        lastUpdatedBy: actorId,
        appointmentId: input.appointmentId
          ? new Types.ObjectId(input.appointmentId)
          : undefined,
        shared: input.shared ?? [],
        tags: input.tags ?? [],
        isFavorited: input.isFavorited ?? false,
        isDeleted: false,
      });

      return {
        status: 201,
        message: 'FOLDER_CREATED_SUCCESSFULLY',
        folder,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        folder: null,
      };
    }
  }

  /**
   * Return non-deleted folders of the actor's office.
   */
  async getFolders(actor: Actor): Promise<GetFoldersRes> {
    try {
      if (!actor.officeId) {
        return { status: 403, message: 'OFFICE_REQUIRED', folders: [] };
      }

      const folders = await this.folderRepository.findWithUser({
        officeId: actor.officeId,
        isDeleted: false,
      });
      return {
        status: 200,
        message: 'FOLDERS_FOUND_SUCCESSFULLY',
        folders,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        folders: [],
      };
    }
  }

  /**
   * Return one folder when it belongs to the actor's office.
   */
  async getFolderById(id: string, actor: Actor): Promise<GetFolderRes> {
    try {
      const folder = await this.folderRepository.findOneWithUser({
        _id: id,
        officeId: actor.officeId,
        isDeleted: false,
      });
      if (!folder) {
        return { status: 404, message: 'FOLDER_NOT_FOUND', folder: null };
      }
      return {
        status: 200,
        message: 'FOLDER_FOUND_SUCCESSFULLY',
        folder,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        folder: null,
      };
    }
  }

  /**
   * Update a folder in the actor's office.
   */
  async updateFolder(
    input: UpdateFolderInput,
    actor: Actor,
  ): Promise<GetFolderRes> {
    try {
      const existing = await this.folderRepository.findOne({
        _id: input.id,
        officeId: actor.officeId,
        isDeleted: false,
      });
      if (!existing) {
        return { status: 404, message: 'FOLDER_NOT_FOUND', folder: null };
      }

      const { id, userId: nextUserId, appointmentId, ...rest } = input;
      const updates: Record<string, unknown> = {
        ...rest,
        lastUpdatedBy: new Types.ObjectId(actor.id),
      };
      if (nextUserId) {
        updates.userId = new Types.ObjectId(nextUserId);
      }
      if (appointmentId) {
        updates.appointmentId = new Types.ObjectId(appointmentId);
      }
      const folder = await this.folderRepository.findOneAndUpdate(
        { _id: id },
        updates,
      );
      return {
        status: 200,
        message: 'FOLDER_UPDATED_SUCCESSFULLY',
        folder: folder ?? null,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        folder: null,
      };
    }
  }

  /**
   * Soft-delete a folder. The record stays.
   */
  async deleteFolder(id: string, actor: Actor): Promise<IBaseRes> {
    try {
      const existing = await this.folderRepository.findOne({
        _id: id,
        officeId: actor.officeId,
        isDeleted: false,
      });
      if (!existing) {
        return { status: 404, message: 'FOLDER_NOT_FOUND' };
      }

      await this.folderRepository.findOneAndUpdate(
        { _id: id },
        { isDeleted: true },
      );
      return { status: 200, message: 'FOLDER_DELETED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  /**
   * Set or clear the favorite flag on a folder.
   */
  async favoriteFolder(
    input: FavoriteFolderInput,
    actor: Actor,
  ): Promise<IBaseRes> {
    try {
      const folder = await this.folderRepository.findOneAndUpdate(
        { _id: input.id, officeId: actor.officeId, isDeleted: false },
        {
          isFavorited: input.isFavorited,
          lastUpdatedBy: new Types.ObjectId(actor.id),
        },
      );
      if (!folder) {
        return { status: 404, message: 'FOLDER_NOT_FOUND' };
      }
      return { status: 200, message: 'FOLDER_UPDATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  /**
   * Replace the tags of a folder.
   */
  async updateFolderTags(
    input: FolderTagsInput,
    actor: Actor,
  ): Promise<IBaseRes> {
    try {
      const folder = await this.folderRepository.findOneAndUpdate(
        { _id: input.id, officeId: actor.officeId, isDeleted: false },
        { tags: input.tags, lastUpdatedBy: new Types.ObjectId(actor.id) },
      );
      if (!folder) {
        return { status: 404, message: 'FOLDER_NOT_FOUND' };
      }
      return { status: 200, message: 'FOLDER_UPDATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  /**
   * Replace the shared emails of a folder.
   */
  async updateFolderShared(
    input: FolderSharedInput,
    actor: Actor,
  ): Promise<IBaseRes> {
    try {
      const folder = await this.folderRepository.findOneAndUpdate(
        { _id: input.id, officeId: actor.officeId, isDeleted: false },
        { shared: input.shared, lastUpdatedBy: new Types.ObjectId(actor.id) },
      );
      if (!folder) {
        return { status: 404, message: 'FOLDER_NOT_FOUND' };
      }
      return { status: 200, message: 'FOLDER_UPDATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }
}
