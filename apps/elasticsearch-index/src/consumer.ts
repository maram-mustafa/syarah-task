import "reflect-metadata";
import {appContainer} from "./app/appContainer.js";
import {TYPES, ConnectionManager, RabbitMQConnection, App} from "@my/common";
import {IndexSyncService, SyncEvent} from "./services/IndexSyncService.js";
import {ConfirmChannel, ConsumeMessage} from "amqplib";

await appContainer.run(async (app: App) => {
    const connectionManager = app.get<ConnectionManager>(TYPES.ConnectionManager);
    const rabbitMQConnection = await connectionManager.resolve<RabbitMQConnection>("rabbitmqCon");
    const indexSyncService = app.get<IndexSyncService>("IndexSyncService");

    await rabbitMQConnection.consume("product.sync", 10, async (msg: ConsumeMessage, channel: ConfirmChannel) => {
            try {
                const content = msg.content.toString();
                const event: SyncEvent = JSON.parse(content);

                console.log(`received :: ${event.operation} for product ${event.productId}`);

                if (!event.operation || !event.productId) {
                    console.error("Invalid sync event format..");
                    return;
                }

                await indexSyncService.handleSyncEvent(event);

                console.log(`processed successfully...`);
            } catch (error) {
                console.error(`failed to process message ::`, error);

                await rabbitMQConnection.publishToExchange("failed_messages", "sync.error",
                    {
                        originalMessage: msg.content.toString(),
                        error: error instanceof Error ? error.message : String(error),
                        timestamp: new Date().toISOString(),
                    }
                );
                return
            }
        }
    );

    console.log("Consumer is running...");
});
