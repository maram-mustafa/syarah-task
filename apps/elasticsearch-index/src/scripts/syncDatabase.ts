import "reflect-metadata";
import { appContainer } from "../app/appContainer.js";
import { TYPES } from "@my/common";
import { SequelizeManager } from "@my/sequelize";

await appContainer.run(async (app) => {
    try {
        console.log("Starting database synchronization...");

        const sequelizeManager = app.get<SequelizeManager>(TYPES.SequelizeManager);
        const sequelizeWrapper = await sequelizeManager.connection();
        const sequelize = sequelizeWrapper.getConnection();

        const force = process.argv.includes("--force");

        console.log(`Syncing models (force: ${force})...`);
        await sequelize.sync({ force });

        console.log("");
        console.log("✓ Database synchronized successfully!");
        console.log("");
        console.log("Tables created:");
        const [results] = await sequelize.query("SHOW TABLES");
        results.forEach((row: any) => {
            console.log(`  - ${Object.values(row)[0]}`);
        });

        console.log("");
        console.log("Next steps:");
        console.log("  1. Run 'npm run seed:products' to populate the database");
        console.log("  2. Run 'npm run sync:initial' to sync products to Elasticsearch");
        console.log("");

    } catch (error) {
        console.error("✗ Database synchronization failed:", error);
        process.exit(1);
    }
});