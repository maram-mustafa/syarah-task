import "reflect-metadata";
import {appContainer} from "./app/appContainer.js";
import {App, ConnectionManager, RabbitMQConnection, TYPES} from "@my/common";
import {NotificationService} from "./services/NotificationService.js";
import {OutboxRepository} from "./repositories/OutboxRepository.js";
import {ConfirmChannel, ConsumeMessage} from "amqplib";

await appContainer.run(async (app: App) => {
    console.log("starting the notification consumer...");

    const connectionManager = app.get<ConnectionManager>(TYPES.ConnectionManager);
    const rabbitMQConnection = await connectionManager.resolve<RabbitMQConnection>("rabbitmqCon");

    const notificationService = app.get<NotificationService>("NotificationService");
    const outboxRepo = app.get<OutboxRepository>("OutboxRepository");

    await rabbitMQConnection.consume("notification.queue", 1, async (msg: ConsumeMessage, channel: ConfirmChannel) => {
        const parsedMsg = JSON.parse(msg.content.toString());
        console.log("Parsed message:", parsedMsg);

        try {
            console.log("received message for outbox ID ::", parsedMsg.outboxId);

            const outboxRecord = await outboxRepo.findByIdempotencyKey(parsedMsg.idempotencyKey);

            if (!outboxRecord) {
                console.warn("Outbox record not found :: ", parsedMsg.idempotencyKey);
                return;
            }

            if (!outboxRecord || outboxRecord.status === "sent" || outboxRecord.status === "failed") return;

            const result = await notificationService.processOutboxMessage({
                id: outboxRecord.id,
                campaign_id: outboxRecord.campaign_id,
                user_ref: outboxRecord.user_ref,
                kind: outboxRecord.kind,
                payload: outboxRecord.payload as any,
                attempts: outboxRecord.attempts,
            });

            if (result.success) {
                await outboxRepo.markSent(outboxRecord.id, result.providerId);
                console.log(`Message processed and marked as sent. Provider ID: ${result.providerId}`);
            } else {
                await outboxRepo.incrementAttempt(outboxRecord.id, result.error);
                console.log(`Message processing failed. Error: ${result.error}`);
            }
        } catch (error: any) {
            console.error("Error processing message :: ", error.message);
            throw error;
        }
    });
    console.log("Consumer is running...");
});