import { Logger } from "@nestjs/common";
import { AbstractDocument } from "./abstract.schema";
import { Connection, FilterQuery, Model, SaveOptions, Types, UpdateQuery } from "mongoose";

export abstract class AbstractRepository<TDocument extends AbstractDocument> {

    protected abstract readonly logger: Logger;

    constructor(
        private readonly model: Model<TDocument>,
        private readonly connection: Connection
    ) { }

    async create(document: Omit<TDocument, '_id'>, options?: SaveOptions): Promise<TDocument> {
        const new_document = {
            ...document,
            _id: new Types.ObjectId(),
            isDeleted: false
        }
        const createdDocument = new this.model(new_document);
        return (await createdDocument.save(options))
            .toJSON() as unknown as TDocument;
    }

    async findOne(filterQuery: FilterQuery<TDocument>)/* : Promise<TDocument | undefined> */ {
        const document = await this.model.findOne({
            isDeleted: false,
            ...filterQuery
        }, {}, { lean: true })/*  as TDocument */;

        if (!document) {
            this.logger.warn('Document not found with filterQuery', filterQuery);
            return undefined;
        }

        return document /* as unknown as TDocument */;
    }

    async findOneAndUpdate(filterQuery: FilterQuery<TDocument>, update: UpdateQuery<TDocument>): Promise<TDocument | undefined> {
        const document = await this.model.findOneAndUpdate({
            isDeleted: false,
            ...filterQuery
        }, update, {
            lean: true,
            new: true,
        });

        if (!document) {
            this.logger.warn(`Document not found with filterQuery:`, filterQuery);
            return undefined;
        }

        return document as unknown as TDocument;
    }

    async upsert(filterQuery: FilterQuery<TDocument>, document: Partial<TDocument>) {
        return this.model.findOneAndUpdate({
            isDeleted: false,
            ...filterQuery
        }, document, {
            lean: true,
            upsert: true,
            new: true,
        });
    }

    async find(filterQuery: FilterQuery<TDocument>) {
        return this.model.find({
            isDeleted: false,
            ...filterQuery
        }, {}, { lean: true });
    }

    async startTransaction() {
        const session = await this.connection.startSession();
        session.startTransaction();
        return session;
    }
}