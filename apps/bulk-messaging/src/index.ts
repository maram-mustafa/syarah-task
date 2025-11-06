import "reflect-metadata";
import {appContainer} from "./app/appContainer.js";
import {App} from "@my/common";
import {OutboxPollerService} from "./services/OutboxPollerService.js";

await appContainer.run(async (app: App) => {
    console.log("starting bulk messaging...");
    const outboxPollerService = app.get<OutboxPollerService>("OutboxPollerService");

    await outboxPollerService.start();

    console.log("outboxPollerService started...");
    console.log("polling is working for pending messages and publishing to RabbitMQ");

    process.on("SIGINT", () => {
        console.log("Shutting down gracefully...");
        outboxPollerService.stop();
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        console.log("Shutting down gracefully...");
        outboxPollerService.stop();
        process.exit(0);
    });
});