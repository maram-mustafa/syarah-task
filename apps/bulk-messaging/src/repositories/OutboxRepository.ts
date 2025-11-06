import Outbox from "../models/Outbox.js";
import { Op, Sequelize, ModelStatic } from "sequelize";
import { injectable, inject } from "inversify";
import { SequelizeManager, SequelizeWrapper } from "@my/sequelize";
import { TYPES } from "@my/common";

@injectable()
export class OutboxRepository {
    private readonly MAX_ATTEMPTS = 3;
    private readonly RETRY_DELAY_MINUTES = 5;
    private sequelizeWrapper!: SequelizeWrapper;
    private OutboxModel!: ModelStatic<Outbox>;

    constructor(
        @inject(TYPES.SequelizeManager) private sequelizeManager: SequelizeManager
    ) {}

    async initialize() {
        if (!this.sequelizeWrapper) {
            this.sequelizeWrapper = await this.sequelizeManager.connection();
            this.OutboxModel = this.sequelizeWrapper.getModel(Outbox as any);
        }
    }

    async createBatch(records: any[]) {
        await this.initialize();
        return await this.OutboxModel.bulkCreate(records, {
            ignoreDuplicates: true,
        });
    }

    async getPendingBatch(limit: number, transaction?: any) {
        await this.initialize();
        return await this.OutboxModel.findAll({
            where: { status: "pending" },
            order: [["id", "ASC"]],
            limit,
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
            skipLocked: true,
            transaction,
            raw: true,
        });
    }

    async getRetryableBatch(limit: number, transaction?: any) {
        await this.initialize();
        const retryAfter = new Date(Date.now() - this.RETRY_DELAY_MINUTES * 60 * 1000);

        return await this.OutboxModel.findAll({
            where: {
                status: "retrying",
                attempts: { [Op.lt]: this.MAX_ATTEMPTS },
                updatedAt: { [Op.lt]: retryAfter },
            },
            order: [["id", "ASC"]],
            limit,
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
            skipLocked: true,
            transaction,
            raw: true,
        });
    }

    async markQueued(ids: number[]) {
        await this.initialize();
        await this.OutboxModel.update(
            { status: "queued" },
            { where: { id: { [Op.in]: ids } } }
        );
    }

    async markSent(id: number, providerId?: string) {
        await this.initialize();
        await this.OutboxModel.update(
            { status: "sent", provider_msg_id: providerId },
            { where: { id } }
        );
    }

    async markFailed(id: number, error?: string) {
        await this.initialize();
        await this.OutboxModel.update(
            { status: "failed", last_error: error },
            { where: { id } }
        );
    }

    async incrementAttempt(id: number, error?: string) {
        await this.initialize();
        const record = await this.OutboxModel.findByPk(id);
        if (!record) return;

        const newAttempts = record.attempts + 1;
        const newStatus = newAttempts >= this.MAX_ATTEMPTS ? "failed" : "retrying";

        await this.OutboxModel.update(
            {
                attempts: newAttempts,
                status: newStatus,
                last_error: error,
            },
            { where: { id } }
        );
    }

    async getCampaignStats(campaignId: number) {
        await this.initialize();
        return await this.OutboxModel.findAll({
            where: { campaign_id: campaignId },
            attributes: [
                "status",
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["status"],
            raw: true,
        });
    }

    async findByIdempotencyKey(key: string) {
        await this.initialize();
        return await this.OutboxModel.findOne({
            where: { idempotency_key: key },
        });
    }
}