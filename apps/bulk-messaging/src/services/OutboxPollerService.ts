import {injectable, inject} from "inversify";
import {OutboxRepository} from "../repositories/OutboxRepository.js";
import {ConnectionManager, RabbitMQConnection, TYPES} from "@my/common";
import {SequelizeManager, SequelizeWrapper} from "@my/sequelize";
import {NotificationService} from "./NotificationService.js";

@injectable()
export class OutboxPollerService {
    private isRunning: boolean = false;
    private readonly pollInterval: number = 5000;
    private readonly batchSize: number = 100;
    private sequelizeWrapper!: SequelizeWrapper;

    constructor(
        @inject("OutboxRepository") private outboxRepo: OutboxRepository,
        @inject(TYPES.ConnectionManager) private connectionManager: ConnectionManager,
        @inject(TYPES.SequelizeManager) private sequelizeManager: SequelizeManager,
        @inject("NotificationService") private notificationService: NotificationService
    ) {
    }

    async start() {
        if (this.isRunning) {
            console.log("already running... return same instance");
            return;
        }
        this.isRunning = true;

        this.sequelizeWrapper = await this.sequelizeManager.connection();

        console.log("starting outbox poller service :: ", "Polling interval", this.pollInterval, "Batch size :: ", this.batchSize);

        await this.poll();
    }

    stop() {
        console.log(" outbox poller stopping...");
        this.isRunning = false;
    }

    private async poll() {
        const rabbitMQConnection = await this.connectionManager.resolve<RabbitMQConnection>("rabbitmqCon");

        while (this.isRunning) {
            try {
                await this.processPendingMessages(rabbitMQConnection);
                await this.processRetryableMessages(rabbitMQConnection);
            } catch (error: any) {
                console.error("outbox poller error during polling ::", error.message);
            }

            await this.sleep(this.pollInterval);
        }
    }

    private async processPendingMessages(rabbitMQConnection: RabbitMQConnection) {
        const sequelize = this.sequelizeWrapper.getConnection();
        const transaction = await sequelize.transaction();

        try {
            const pendingMessages = await this.outboxRepo.getPendingBatch(this.batchSize, transaction);
            if (pendingMessages.length === 0) {
                await transaction.commit();
                return;
            }

            console.log(`outbox poller Found :: ${pendingMessages.length} pending messages`);
            console.log("Sample message structure:", JSON.stringify(pendingMessages[0]));

            transaction.afterCommit(async () => {
                for (const message of pendingMessages) {
                    try {
                        console.log("Publishing message:", {
                            id: message.id,
                            idempotency_key: message.idempotency_key,
                            campaign_id: message.campaign_id
                        });
                        await rabbitMQConnection.sendConfirmedMsgToQueue(
                            "notification.queue",
                            {
                                outboxId: message.id,
                                idempotencyKey: message.idempotency_key,
                                campaignId: message.campaign_id,
                                userRef: message.user_ref,
                                kind: message.kind
                            },
                            {
                                persistent: true,
                                messageId: message.idempotency_key,
                            }
                        );
                    } catch (err: any) {
                        console.error(`outbox poller failed to publish message ${message.id}: ${err.message}`);
                    }
                }

                const ids = pendingMessages.map((m: any) => m.id);
                await this.outboxRepo.markQueued(ids);
                console.log(`outbox poller queued ${pendingMessages.length} new messages`);
            });

            await transaction.commit();
        } catch (error: any) {
            await transaction.rollback();
            console.error("outbox poller failed to process pending messages :: ", error.message);
        }
    }

    private async processRetryableMessages(rabbitMQConnection: RabbitMQConnection) {
        const sequelize = this.sequelizeWrapper.getConnection();
        const transaction = await sequelize.transaction();

        try {
            const retryableMessages = await this.outboxRepo.getRetryableBatch(this.batchSize, transaction);
            if (retryableMessages.length === 0) {
                await transaction.commit();
                return;
            }

            console.log(`outbox poller found ${retryableMessages.length} messages for retry`);

            transaction.afterCommit(async () => {
                for (const message of retryableMessages) {
                    try {
                        await rabbitMQConnection.sendConfirmedMsgToQueue(
                            "notification.queue",
                            {
                                outboxId: message.id,
                                idempotencyKey: message.idempotency_key,
                                campaignId: message.campaign_id,
                                userRef: message.user_ref,
                                kind: message.kind
                            },
                            {
                                persistent: true,
                                messageId: message.idempotency_key,
                            }
                        );
                    } catch (err: any) {
                        console.error(`outbox poller failed to republish message ${message.id}: ${err.message}`);
                    }
                }

                const ids = retryableMessages.map((m: any) => m.id);
                await this.outboxRepo.markQueued(ids);
                console.log(`outbox poller re-queued ${retryableMessages.length} messages`);
            });

            await transaction.commit();
        } catch (error: any) {
            await transaction.rollback();
            console.error("outbox poller failed to process retryable messages :: ", error.message);
        }
    }

    private async handleMessageDelivery(message: any) {
        const result = await this.notificationService.processOutboxMessage({
            id: message.id,
            campaign_id: message.campaign_id,
            user_ref: message.user_ref,
            kind: message.kind,
            payload: message.payload,
            attempts: message.attempts
        });

        if (result.success) {
            await this.outboxRepo.markSent(message.id, result.providerId);
        } else {
            await this.outboxRepo.incrementAttempt(message.id, result.error);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}