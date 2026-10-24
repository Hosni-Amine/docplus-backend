import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { deleteUploadedFile, ERole } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { Folder } from '../folder/entities/folder.entity';
import { FolderRepository } from '../folder/folder.repository';
import { CreateDocumentInput } from './dto/create-document.input';
import { UpdateDocumentInput } from './dto/update-document.input';
import { FolderDocument } from './entities/document.entity';
import { DocumentRepository } from './document.repository';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: { toString(): string } | string;
};

export interface GetDocumentRes extends IBaseRes {
  document: FolderDocument | null;
}

export interface GetDocumentsRes extends IBaseRes {
  documents: FolderDocument[];
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly folderRepository: FolderRepository,
  ) {}

  private findFolder(folderId: string | Types.ObjectId, actor: Actor) {
    return this.folderRepository.findOne({
      _id: folderId,
      officeId: actor.officeId,
      isDeleted: false,
    });
  }

  /**
   * Files must already be on the document or come from the folder user's
   * upload directory, so a request cannot attach (and later delete) any other file.
   */
  private hasForeignFiles(
    files: string[],
    folder: Folder,
    allowed: string[] = [],
  ) {
    const prefix = `/uploads/folders/${folder.userId.toString()}/`;
    return files.some(
      (url) =>
        !allowed.includes(url) &&
        (!url.startsWith(prefix) || url.includes('..')),
    );
  }

  /**
   * Add a document to a folder of the actor's office.
   */
  async createDocument(
    input: CreateDocumentInput,
    actor: Actor,
  ): Promise<GetDocumentRes> {
    try {
      if (!actor.officeId || !actor.id) {
        return { status: 403, message: 'OFFICE_REQUIRED', document: null };
      }

      const folder = await this.findFolder(input.folderId, actor);
      if (!folder) {
        return { status: 404, message: 'FOLDER_NOT_FOUND', document: null };
      }
      if (this.hasForeignFiles(input.files ?? [], folder)) {
        return { status: 400, message: 'INVALID_FILE', document: null };
      }

      const actorId = new Types.ObjectId(actor.id);
      const created = await this.documentRepository.create({
        folderId: folder._id,
        officeId: folder.officeId,
        type: input.type,
        title: input.title,
        date: new Date(input.date),
        author: input.author,
        notes: input.notes,
        appointmentId: input.appointmentId
          ? new Types.ObjectId(input.appointmentId)
          : undefined,
        files: input.files ?? [],
        createdBy: actorId,
        lastUpdatedBy: actorId,
        isDeleted: false,
      });

      const document = await this.documentRepository.findOneWithUser({
        _id: created._id,
      });
      return {
        status: 201,
        message: 'DOCUMENT_CREATED_SUCCESSFULLY',
        document,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        document: null,
      };
    }
  }

  /**
   * Return non-deleted documents of a folder, newest exam or visit first.
   */
  async getDocuments(folderId: string, actor: Actor): Promise<GetDocumentsRes> {
    try {
      const folder = await this.findFolder(folderId, actor);
      if (!folder) {
        return { status: 404, message: 'FOLDER_NOT_FOUND', documents: [] };
      }

      const documents = await this.documentRepository.findWithUser({
        folderId: folder._id,
        isDeleted: false,
      });
      return {
        status: 200,
        message: 'DOCUMENTS_FOUND_SUCCESSFULLY',
        documents,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        documents: [],
      };
    }
  }

  /**
   * Update a document in the actor's office.
   * Sending files replaces the URL list. Removed uploads are deleted.
   */
  async updateDocument(
    input: UpdateDocumentInput,
    actor: Actor,
  ): Promise<GetDocumentRes> {
    try {
      const existing = await this.documentRepository.findOne({
        _id: input.id,
        officeId: actor.officeId,
        isDeleted: false,
      });
      if (!existing) {
        return { status: 404, message: 'DOCUMENT_NOT_FOUND', document: null };
      }

      const { id, appointmentId, date, files, ...rest } = input;
      const updates: Record<string, unknown> = {
        ...rest,
        lastUpdatedBy: new Types.ObjectId(actor.id),
      };
      if (appointmentId) {
        updates.appointmentId = new Types.ObjectId(appointmentId);
      }
      if (date) {
        updates.date = new Date(date);
      }
      if (files) {
        const folder = await this.findFolder(existing.folderId, actor);
        if (!folder) {
          return { status: 404, message: 'FOLDER_NOT_FOUND', document: null };
        }
        if (this.hasForeignFiles(files, folder, existing.files)) {
          return { status: 400, message: 'INVALID_FILE', document: null };
        }
        updates.files = files;
      }

      await this.documentRepository.findOneAndUpdate({ _id: id }, updates);

      const removed = files
        ? (existing.files ?? []).filter((url) => !files.includes(url))
        : [];
      if (removed.length) {
        await deleteUploadedFile(removed);
      }
      const document = await this.documentRepository.findOneWithUser({
        _id: id,
      });
      return {
        status: 200,
        message: 'DOCUMENT_UPDATED_SUCCESSFULLY',
        document,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        document: null,
      };
    }
  }

  /**
   * Soft-delete a document. The record and its files stay.
   */
  async deleteDocument(id: string, actor: Actor): Promise<IBaseRes> {
    try {
      const document = await this.documentRepository.findOneAndUpdate(
        { _id: id, officeId: actor.officeId, isDeleted: false },
        { isDeleted: true, lastUpdatedBy: new Types.ObjectId(actor.id) },
      );
      if (!document) {
        return { status: 404, message: 'DOCUMENT_NOT_FOUND' };
      }
      return { status: 200, message: 'DOCUMENT_DELETED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }
}
