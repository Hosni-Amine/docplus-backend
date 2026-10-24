import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../common/database/database.module';
import { FolderModule } from '../folder/folder.module';
import {
  FolderDocument,
  FolderDocumentSchema,
} from './entities/document.entity';
import { DocumentController } from './document.controller';
import { DocumentRepository } from './document.repository';
import { DocumentService } from './document.service';

@Module({
  imports: [
    DatabaseModule,
    FolderModule,
    MongooseModule.forFeature([
      { name: FolderDocument.name, schema: FolderDocumentSchema },
    ]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRepository],
})
export class DocumentModule {}
