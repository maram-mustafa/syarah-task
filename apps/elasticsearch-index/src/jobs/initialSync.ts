import "reflect-metadata";
import {appContainer} from "../app/appContainer.js";
import {TYPES} from "@my/common";
import {IndexSyncService} from "../services/IndexSyncService.js";
import {SequelizeManager} from "@my/sequelize";

await appContainer.job(async (app) => {
    try {
        const sequelizeManager = app.get<SequelizeManager>(TYPES.SequelizeManager);
        await sequelizeManager.connection();
        const indexSyncService = app.get<IndexSyncService>("IndexSyncService");

        const stats = await indexSyncService.performInitialSync();
        console.log(`Total products: ${stats.total}`);
        console.log(`Successfully indexed: ${stats.indexed}`);
        console.log(`Failed: ${stats.failed}`);

        if (stats.failed > 0) {
            console.warn(`\n⚠ Warning: ${stats.failed} products failed to index`);
            process.exit(1);
        }

        console.log("\n✓ Initial sync completed successfully!");
    } catch (error) {
        console.error("\n✗ Initial sync failed:", error);
        process.exit(1);
    }
});